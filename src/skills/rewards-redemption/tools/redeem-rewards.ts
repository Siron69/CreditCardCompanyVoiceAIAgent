import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "redeem-rewards",
  description:
    "Redeems loyalty points for a reward chosen by the customer. Requires explicit confirmation before proceeding.",
  params: s.object({
    reward_id: s.string().describe("ID of the reward to redeem"),
    reward_name: s.string().describe("Name of the reward (used for voice confirmation)"),
    confirmed: s.boolean().describe("true if the customer has already confirmed, false to prompt for confirmation"),
  }),
  handler: async (ctx, params) => {
    try {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Customer not authenticated. Please authenticate first." };
    }

    if (!params.confirmed) {
      return { success: false, needs_confirmation: true, message: `You are about to redeem: ${params.reward_name}. Do you confirm you want to proceed?` };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
    const apiKey = typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as { value: string }).value
      : rawSecret as string;
    const response = await fetch(`${apiUrl}/redeemreward`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ customer_id: customerId, reward_id: params.reward_id }),
    });

    if (!response.ok) {
      return { success: false, message: "Error during redemption. Please try again or contact support." };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.message ?? "Insufficient points or reward unavailable." };
    }

    return { success: true, points_used: data.points_used, remaining_balance: data.remaining_balance, message: `Redemption complete! You used ${data.points_used} points for ${params.reward_name}. Remaining balance: ${data.remaining_balance} points.` };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in redeem-rewards. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
