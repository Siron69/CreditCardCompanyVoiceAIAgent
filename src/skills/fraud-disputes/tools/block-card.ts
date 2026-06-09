import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "block-card",
  description:
    "Blocca immediatamente la carta del cliente autenticato. Invia SMS di conferma.",
  params: s.object({
    reason: s.string().describe("Motivo del blocco: 'smarrita', 'rubata', 'transazioni_sospette', 'altro'"),
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/blockCard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, reason: params.reason }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nel blocco della carta. Riprova o contatta il supporto." };
    }

    const data = await response.json();
    ctx.kv.set("authenticated_account_status", "blocked");

    const fromNumber = ctx.metadata.communication.fromNumber;
    if (fromNumber) {
      ctx.telephony.sendSms(fromNumber, `SpaceCard: La tua carta è stata bloccata. Per sbloccarla chiama il numero verde o accedi all'app. Rif: ${customerId}`);
    }

    return { success: true, blocked_at: data.blocked_at, message: "Carta bloccata con successo. Riceverai un SMS di conferma. Per richiedere lo sblocco sarà necessaria una verifica aggiuntiva." };
  },
});
