import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "check-unblock-status",
  description: "Verifica lo stato di una richiesta di sblocco carta precedentemente inviata.",
  params: s.object({
    case_id: s.optional(s.string()).describe("ID del caso. Se omesso, usa quello della sessione corrente."),
  }),
  handler: async (ctx, params) => {
    const caseId = params.case_id ?? (ctx.kv.get("unblock_case_id") as string);

    if (!caseId) {
      return { success: false, message: "Nessuna richiesta di sblocco trovata. Fornisci il numero di riferimento ricevuto via SMS." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/getUnblockCaseStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nella verifica dello stato. Riprova." };
    }

    const data = await response.json();

    const messages: Record<string, string> = {
      pending: "La tua richiesta è ancora in esame. Ti contatteremo entro 24 ore lavorative.",
      approved: "Ottima notizia! La tua richiesta è stata approvata. La tua carta è ora attiva.",
      denied: `La tua richiesta non è stata approvata.${data.reviewer_notes ? ` Nota: ${data.reviewer_notes}` : ""} Per assistenza puoi parlare con un operatore.`,
    };

    return { success: true, status: data.status, reviewer_notes: data.reviewer_notes ?? null, message: messages[data.status] ?? "Stato non riconosciuto. Contatta il supporto." };
  },
});
