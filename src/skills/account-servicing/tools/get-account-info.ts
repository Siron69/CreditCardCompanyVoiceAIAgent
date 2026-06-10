import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-account-info",
  description:
    "Retrieves the authenticated customer's account information: balance, credit limit, next payment date, minimum payment.",
  params: s.object({}),
  handler: async (ctx, _params) => {
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
    const response = await fetch(`${apiUrl}/getaccountinfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (!response.ok) {
      return { success: false, message: "Error retrieving account information. Please try again." };
    }

    const data = await response.json();
    return { success: true, ...data };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in get-account-info. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
