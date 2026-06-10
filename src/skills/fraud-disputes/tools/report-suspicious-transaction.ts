import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "report-suspicious-transaction",
  description: "Reports a transaction as suspicious or fraudulent and opens a dispute.",
  params: s.object({
    transaction_id: s.string().describe("ID of the transaction to dispute"),
    reason: s.string().describe("Reason: 'unrecognised', 'wrong_amount', 'goods_not_received', 'fraud', 'other'"),
  }),
  handler: async (ctx, params) => {
    try {
    const customerId = ctx.kv.exists("authenticated_customer_id") ? (ctx.kv.get("authenticated_customer_id") as string) : null;
    if (!customerId) {
      return { success: false, message: "Customer not authenticated. Please authenticate first." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
    const apiKey = typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as { value: string }).value
      : rawSecret as string;
    const response = await fetch(`${apiUrl}/reportsuspicioustransaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ customer_id: customerId, transaction_id: params.transaction_id, reason: params.reason }),
    });

    if (!response.ok) {
      return { success: false, message: "Error reporting the transaction. Please try again or contact support." };
    }

    const data = await response.json();
    return { success: true, dispute_id: data.dispute_id, message: `Transaction disputed (dispute reference: ${data.dispute_id}). You will receive email updates within 5 business days.` };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in report-suspicious-transaction. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
