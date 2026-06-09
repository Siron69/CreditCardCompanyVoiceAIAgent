import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-transactions",
  description:
    "Recupera le transazioni recenti del cliente autenticato. Può filtrare per stato.",
  params: s.object({
    limit: s.optional(s.number()).describe("Numero massimo di transazioni (default: 10)"),
    status_filter: s.optional(s.string()).describe("Filtra per stato: completata, in_attesa, contestata, frode"),
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/getTransactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        limit: params.limit ?? 10,
        status_filter: params.status_filter ?? null,
      }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nel recupero delle transazioni. Riprova." };
    }

    const data = await response.json();
    return { success: true, transactions: data.transactions ?? [] };
  },
});
