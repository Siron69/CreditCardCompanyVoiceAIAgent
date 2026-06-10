import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-transactions",
  description:
    "Retrieves recent transactions for the authenticated customer. Can filter by status.",
  params: s.object({
    limit: s.optional(s.number()).describe("Maximum number of transactions to return (default: 10)"),
    status_filter: s.optional(s.string()).describe("Filter by status: completed, pending, disputed, fraud"),
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
    const response = await fetch(`${apiUrl}/gettransactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        customer_id: customerId,
        limit: params.limit ?? 10,
        status_filter: params.status_filter ?? null,
      }),
    });

    if (!response.ok) {
      return { success: false, message: "Error retrieving transactions. Please try again." };
    }

    const data = await response.json();
    return { success: true, transactions: data.transactions ?? [] };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in get-transactions. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
