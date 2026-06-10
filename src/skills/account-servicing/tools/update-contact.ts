import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "update-contact",
  description: "Updates the authenticated customer's email address or phone number.",
  params: s.object({
    email: s.optional(s.string()).describe("New email address"),
    phone: s.optional(s.string()).describe("New Italian phone number (e.g. +39 333 1234567)"),
  }),
  handler: async (ctx, params) => {
    try {
    const customerId = ctx.kv.exists("authenticated_customer_id") ? (ctx.kv.get("authenticated_customer_id") as string) : null;
    if (!customerId) {
      return { success: false, message: "Customer not authenticated. Please authenticate first." };
    }

    if (!params.email && !params.phone) {
      return { success: false, message: "Please specify at least one field to update (email or phone)." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
    const apiKey = typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as { value: string }).value
      : rawSecret as string;
    const response = await fetch(`${apiUrl}/updatecontactinfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ customer_id: customerId, email: params.email ?? null, phone: params.phone ?? null }),
    });

    if (!response.ok) {
      return { success: false, message: "Error updating contact info. Please try again or contact support." };
    }

    const updated = [];
    if (params.email) updated.push(`email: ${params.email}`);
    if (params.phone) updated.push(`phone: ${params.phone}`);

    return { success: true, message: `Contact info updated successfully: ${updated.join(", ")}.` };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in update-contact. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
