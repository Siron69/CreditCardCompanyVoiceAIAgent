import { w } from "@wonderful/types/schema";
import queryKnowledgeBase from "./tools/query-knowledge-base";

export default w.skill({
  name: "knowledge-rag",
  description:
    "Risponde a domande generali su prodotti SpaceCard, benefici, commissioni, policy e educazione finanziaria. Non richiede autenticazione.",
  prompt: "src/skills/knowledge-rag/prompt.md",
  tools: [queryKnowledgeBase],
});
