import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "query-knowledge-base",
  description:
    "Cerca nella knowledge base SpaceCard per rispondere a domande generali su benefici, commissioni, tassi APR, programmi rewards, processi di richiesta, policy e educazione finanziaria. Non richiede autenticazione.",
  params: s.object({
    query: s.string().describe("La domanda o l'argomento da cercare nella knowledge base"),
  }),
  handler: async (ctx, params) => {
    const knowledgeBaseId = ctx.globals.get("knowledge_base_id") as string;
    const results = await ctx.tools.callRag(knowledgeBaseId, params.query);

    if (!results || (Array.isArray(results) && results.length === 0)) {
      return { success: false, message: "Non ho trovato informazioni su questo argomento. Posso trasferirla a un operatore specializzato." };
    }

    return { success: true, results };
  },
});
