import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "update-contact",
  description: "Updates the authenticated customer's email address or phone number.",
  params: s.object({
    email: s.optional(s.string()).describe("New email address"),
    phone: s.optional(s.string()).describe("New phone number. Will be normalized to E.164 (+39 assumed for numbers without a country prefix), e.g. +393331234567"),
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
    const newEmail = params.email?.trim() ?? null;

    // Normalize the phone to E.164: strip everything but digits and "+",
    // convert "00" international prefix, default to +39 (Italy)
    let newPhone = params.phone?.trim() ?? null;
    if (newPhone) {
      newPhone = newPhone.replace(/[^\d+]/g, "");
      if (newPhone.startsWith("00")) newPhone = "+" + newPhone.slice(2);
      if (!newPhone.startsWith("+")) newPhone = "+39" + newPhone;
      if (!/^\+\d{7,15}$/.test(newPhone)) {
        return { success: false, message: "The phone number does not look valid. Please dictate it again, digit by digit." };
      }
    }

    const response = await fetch(`${apiUrl}/updatecontactinfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ customer_id: customerId, email: newEmail, phone: newPhone }),
    });

    if (!response.ok) {
      return { success: false, message: "Error updating contact info. Please try again or contact support." };
    }

    // Verify the write actually persisted — the API function may return 200
    // without updating the row
    try {
      const check = await ctx.tables.filter("customers", [
        { column: "customer_id", operator: "eq", value: customerId },
      ], 1);
      const row = check.rows[0]?.data;
      const rowFound = check.rows.length > 0;
      const emailPersisted = !newEmail || row?.email === newEmail;
      const phonePersisted = !newPhone || row?.phone === newPhone;
      if (rowFound && (!emailPersisted || !phonePersisted)) {
        ctx.agent.sendSystemMessage(
          "update-contact: the updatecontactinfo API function returned OK but the customers row was not updated. Check the function on the dashboard."
        );
        return { success: false, message: "The update could not be saved in our systems. Please try again later, or I can transfer you to an agent." };
      }
    } catch (_verifyErr) {
      // Verification is best-effort — if the table read fails, trust the API response
    }

    try { ctx.metadata.attachTag("contact_update"); } catch (_tagErr) { /* tag may not exist yet */ }

    const updated = [];
    if (newEmail) updated.push(`email: ${newEmail}`);
    if (newPhone) updated.push(`phone: ${newPhone}`);

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
