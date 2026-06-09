import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "report-suspicious-transaction",
  description: "Segnala una transazione come sospetta o fraudolenta e apre una disputa.",
  params: s.object({
    transaction_id: s.string().describe("ID della transazione da contestare"),
    reason: s.string().describe("Motivo: 'non_riconosciuta', 'importo_errato', 'merce_non_ricevuta', 'frode', 'altro'"),
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/reportSuspiciousTransaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, transaction_id: params.transaction_id, reason: params.reason }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nella segnalazione. Riprova o contatta il supporto." };
    }

    const data = await response.json();
    return { success: true, dispute_id: data.dispute_id, message: `Transazione contestata (rif. disputa: ${data.dispute_id}). Riceverai aggiornamenti via email entro 5 giorni lavorativi.` };
  },
});
