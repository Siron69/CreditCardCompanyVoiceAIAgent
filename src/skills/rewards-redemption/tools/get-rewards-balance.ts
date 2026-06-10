import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-rewards-balance",
  description: "Retrieves the authenticated customer's loyalty points balance, tier, and points expiry date.",
  params: s.object({}),
  handler: async (ctx, _params) => {
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
    const response = await fetch(`${apiUrl}/getrewardsbalance`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (!response.ok) {
      return { success: false, message: "Error retrieving points balance. Please try again." };
    }

    const data = await response.json();

    if (data.points_expiry_date) {
      const expiry = new Date(data.points_expiry_date);
      const today = new Date();
      const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToExpiry <= 30 && daysToExpiry > 0) {
        ctx.agent.sendSystemMessage(`WARNING: Customer's points expire in ${daysToExpiry} days. Suggest redeeming them.`);
      }
    }

    return { success: true, ...data };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in get-rewards-balance. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
