import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "check-unblock-status",
  description: "Checks the status of a previously submitted card unblock request.",
  params: s.object({
    case_id: s.optional(s.string()).describe("Case ID. If omitted, uses the one stored in the current session."),
  }),
  handler: async (ctx, params) => {
    try {
    const caseId = params.case_id ?? (ctx.kv.get("unblock_case_id") as string);

    if (!caseId) {
      return { success: false, message: "No unblock request found. Please provide the reference number received by SMS." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
    const apiKey = typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as { value: string }).value
      : rawSecret as string;
    const response = await fetch(`${apiUrl}/getunblockcasestatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ case_id: caseId }),
    });

    if (!response.ok) {
      return { success: false, message: "Error checking the status. Please try again." };
    }

    const data = await response.json();

    const messages: Record<string, string> = {
      pending: "Your request is still under review. We will contact you within 24 business hours.",
      approved: "Great news! Your request has been approved. Your card is now active.",
      denied: `Your request was not approved.${data.reviewer_notes ? ` Note: ${data.reviewer_notes}` : ""} For assistance you can speak with an agent.`,
    };

    return { success: true, status: data.status, reviewer_notes: data.reviewer_notes ?? null, message: messages[data.status] ?? "Status unrecognised. Please contact support." };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in check-unblock-status. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
