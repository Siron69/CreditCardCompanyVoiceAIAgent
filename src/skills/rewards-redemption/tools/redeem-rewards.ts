import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "redeem-rewards",
  description:
    "Riscatta punti fedeltà per un premio scelto dal cliente. Chiede conferma prima di procedere.",
  params: s.object({
    reward_id: s.string().describe("ID del premio da riscattare"),
    reward_name: s.string().describe("Nome del premio (per conferma vocale)"),
    confirmed: s.boolean().describe("true se il cliente ha già confermato, false per chiedere conferma"),
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    if (!params.confirmed) {
      return { success: false, needs_confirmation: true, message: `Stai per riscattare: ${params.reward_name}. Confermi di voler procedere?` };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/redeemReward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, reward_id: params.reward_id }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nel riscatto. Riprova o contatta il supporto." };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.message ?? "Punti insufficienti o premio non disponibile." };
    }

    return { success: true, points_used: data.points_used, remaining_balance: data.remaining_balance, message: `Riscatto completato! Hai utilizzato ${data.points_used} punti per ${params.reward_name}. Saldo residuo: ${data.remaining_balance} punti.` };
  },
});
