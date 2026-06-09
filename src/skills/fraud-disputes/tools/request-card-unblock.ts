import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "request-card-unblock",
  description:
    "Invia una richiesta di sblocco carta alla piattaforma di review esterna. NON sblocca automaticamente — la decisione spetta a un operatore umano.",
  params: s.object({
    customer_stated_reason: s.string().describe("Motivo dichiarato dal cliente per richiedere lo sblocco"),
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    const accountStatus = ctx.kv.get("authenticated_account_status") as string;

    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    if (accountStatus !== "blocked") {
      return { success: false, message: "La carta non risulta bloccata. Nessuna richiesta necessaria." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;

    const accountResponse = await fetch(`${apiUrl}/getAccountInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (!accountResponse.ok) {
      return { success: false, message: "Errore nel recupero dati. Riprova tra un momento." };
    }

    const accountData = await accountResponse.json();

    const caseResponse = await fetch(`${apiUrl}/createUnblockCase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        card_last_four: accountData.last_four ?? "****",
        block_reason: accountData.block_reason ?? "non specificato",
        customer_stated_reason: params.customer_stated_reason,
      }),
    });

    if (!caseResponse.ok) {
      return { success: false, message: "Impossibile inviare la richiesta. Riprova o contatta il supporto." };
    }

    const caseData = await caseResponse.json();
    ctx.kv.set("unblock_case_id", caseData.case_id);

    const fromNumber = ctx.metadata.communication.fromNumber;
    if (fromNumber) {
      ctx.telephony.sendSms(fromNumber, `SpaceCard: Richiesta sblocco ricevuta (Rif: ${caseData.case_id}). Il team la esaminerà entro 24 ore lavorative.`);
    }

    return { success: true, case_id: caseData.case_id, message: `Richiesta inviata al team di sicurezza (riferimento: ${caseData.case_id}). Riceverai risposta entro 24 ore. Ti è stato inviato un SMS di conferma.` };
  },
});
