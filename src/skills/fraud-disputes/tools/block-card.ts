import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "block-card",
  description:
    "Immediately blocks the authenticated customer's card. Sends an SMS confirmation.",
  params: s.object({
    reason: s.string().describe("Reason for blocking: 'lost', 'stolen', 'suspicious_transactions', 'other'"),
  }),
  handler: async (ctx, params) => {
    try {
      const customerId = ctx.kv.get("authenticated_customer_id") as string;
      if (!customerId) {
        return { success: false, message: "Customer not authenticated. Please authenticate first." };
      }

      const apiUrl = ctx.globals.get("api_base_url") as string;
      const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
      const apiKey = typeof rawSecret === "object" && rawSecret !== null
        ? (rawSecret as { value: string }).value
        : rawSecret as string;

      const response = await fetch(`${apiUrl}/blockcard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ customer_id: customerId, reason: params.reason }),
      });

      if (!response.ok) {
        return { success: false, message: "Error blocking the card. Please try again or contact support." };
      }

      const data = await response.json();
      ctx.kv.set("authenticated_account_status", "blocked");

      // Send SMS — wrapped in try/catch so a bad phone number never crashes the tool
      try {
        const fromNumber = ctx.metadata.communication.fromNumber;
        if (fromNumber && /^\+\d{7,15}$/.test(fromNumber)) {
          ctx.telephony.sendSms(fromNumber, `SpaceCard: La tua carta è stata bloccata. Per sbloccarla chiama il numero verde o accedi all'app. Rif: ${customerId}`);
        }
      } catch (_smsErr) {
        // SMS failure is non-blocking — card is already blocked
      }

      return {
        success: true,
        blocked_at: data.blocked_at,
        message: "Card blocked successfully. You will receive an SMS confirmation. To request an unblock, an additional verification will be required.",
      };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in block-card. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
