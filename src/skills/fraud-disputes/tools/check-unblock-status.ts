import { s, w } from "@wonderful/types/schema";
import { spellForVoice } from "../../../lib/voice-spelling";

export default w.tool({
  name: "check-unblock-status",
  description:
    "Checks the status of a previously submitted card unblock request. If no case ID is provided, looks up the most recent request of the authenticated customer.",
  params: s.object({
    case_id: s.optional(s.string()).describe("Case ID. If omitted, uses the one from the current session or the authenticated customer's most recent request."),
  }),
  handler: async (ctx, params) => {
    try {
    let caseId = params.case_id ?? (ctx.kv.exists("unblock_case_id") ? (ctx.kv.get("unblock_case_id") as string) : null);

    let status: string | null = null;
    let reviewerNotes: string | null = null;

    if (caseId) {
      // Case reference known — read it via the workspace API function
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
      status = data.status ?? null;
      reviewerNotes = data.reviewer_notes ?? null;
    } else {
      // Case opened in a previous conversation — look up the authenticated
      // customer's most recent case via the SDK table functions
      // (default ordering is created_at descending)
      const customerId = ctx.kv.exists("authenticated_customer_id") ? (ctx.kv.get("authenticated_customer_id") as string) : null;

      if (!customerId) {
        return { success: false, message: "Customer not authenticated and no case reference provided. Please authenticate first, or provide the reference number received by SMS." };
      }

      const result = await ctx.tables.filter("card_unblock_cases", [
        { column: "customer_id", operator: "eq", value: customerId },
      ], 1);

      if (result.rows.length === 0) {
        return { success: false, message: "No unblock request found for this customer." };
      }

      const row = result.rows[0].data;
      status = row.status ?? null;
      reviewerNotes = row.reviewer_notes ?? null;
      caseId = (row.case_id ?? result.rows[0].id) as string;
    }

    const messages: Record<string, string> = {
      pending: "Your request is still under review. We will contact you within 24 business hours.",
      approved: "Great news! Your request has been approved. Your card is now active.",
      denied: `Your request was not approved.${reviewerNotes ? ` Note: ${reviewerNotes}` : ""} For assistance you can speak with an agent.`,
    };

    return {
      success: true,
      status,
      reviewer_notes: reviewerNotes,
      case_id: caseId,
      case_id_spelled: caseId ? spellForVoice(String(caseId)) : null,
      message: (status && messages[status]) || "Status unrecognised. Please contact support.",
    };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in check-unblock-status. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
