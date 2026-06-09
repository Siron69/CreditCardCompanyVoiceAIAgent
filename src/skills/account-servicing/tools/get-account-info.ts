import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-account-info",
  description:
    "Recupera le informazioni dell'account del cliente autenticato: saldo, limite di credito, data prossimo pagamento, pagamento minimo.",
  params: s.object({}),
  handler: async (ctx, _params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/getAccountInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nel recupero delle informazioni. Riprova." };
    }

    const data = await response.json();
    return { success: true, ...data };
  },
});
