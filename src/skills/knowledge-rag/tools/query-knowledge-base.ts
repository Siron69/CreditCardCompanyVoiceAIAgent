import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "query-knowledge-base",
  description:
    "Searches the SpaceCard knowledge base to answer general questions about benefits, fees, APR rates, rewards programs, application processes, policies, and financial education. No authentication required.",
  params: s.object({
    query: s.string().describe("The question or topic to search for in the knowledge base"),
  }),
  handler: async (ctx, params) => {
    const knowledgeBaseId = ctx.globals.get("knowledge_base_id") as string;
    const results = await ctx.tools.callRag(knowledgeBaseId, params.query);

    if (!results || (Array.isArray(results) && results.length === 0)) {
      return { success: false, message: "No information found on this topic. I can transfer you to a specialist agent." };
    }

    return { success: true, results };
  },
});
