import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-rewards-balance",
  description: "Recupera il saldo punti fedeltà, il tier e la data di scadenza punti del cliente autenticato.",
  params: s.object({}),
  handler: async (ctx, _params) => {
    const customerId = ctx.kv.get("authenticated_customer_id") as string;
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/getRewardsBalance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nel recupero dei punti. Riprova." };
    }

    const data = await response.json();

    if (data.points_expiry_date) {
      const expiry = new Date(data.points_expiry_date);
      const today = new Date();
      const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToExpiry <= 30 && daysToExpiry > 0) {
        ctx.agent.sendSystemMessage(`ATTENZIONE: I punti del cliente scadono tra ${daysToExpiry} giorni. Suggerisci di riscattarli.`);
      }
    }

    return { success: true, ...data };
  },
});
