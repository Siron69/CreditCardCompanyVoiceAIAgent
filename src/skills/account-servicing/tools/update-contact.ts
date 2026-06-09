import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "update-contact",
  description: "Aggiorna email o numero di telefono del cliente autenticato.",
  params: s.object({
    email: s.optional(s.string()).describe("Nuovo indirizzo email"),
    phone: s.optional(s.string()).describe("Nuovo numero di telefono italiano (es. +39 333 1234567)"),
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    if (!params.email && !params.phone) {
      return { success: false, message: "Specifica almeno un dato da aggiornare (email o telefono)." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/updateContactInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, email: params.email ?? null, phone: params.phone ?? null }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nell'aggiornamento. Riprova o contatta il supporto." };
    }

    const updated = [];
    if (params.email) updated.push(`email: ${params.email}`);
    if (params.phone) updated.push(`telefono: ${params.phone}`);

    return { success: true, message: `Dati aggiornati correttamente: ${updated.join(", ")}.` };
  },
});
