import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-rewards-catalog",
  description: "Retrieves the available rewards catalog for points redemption. No authentication required.",
  params: s.object({}),
  handler: async (ctx, _params) => {
    try {
    const apiUrl = ctx.globals.get("api_base_url") as string;
    const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
    const apiKey = typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as { value: string }).value
      : rawSecret as string;
    const response = await fetch(`${apiUrl}/getrewardscatalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return { success: false, message: "Error retrieving the rewards catalog. Please try again." };
    }

    const data = await response.json();
    return { success: true, catalog: data.rewards ?? [] };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in get-rewards-catalog. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
