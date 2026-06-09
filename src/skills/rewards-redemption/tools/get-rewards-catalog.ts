import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "get-rewards-catalog",
  description: "Recupera il catalogo premi disponibili per il riscatto punti. Non richiede autenticazione.",
  params: s.object({}),
  handler: async (ctx, _params) => {
    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/getRewardsCatalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return { success: false, message: "Errore nel recupero del catalogo. Riprova." };
    }

    const data = await response.json();
    return { success: true, catalog: data.rewards ?? [] };
  },
});
