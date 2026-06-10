import { w } from "@wonderful/types/schema";
import queryKnowledgeBase from "./tools/query-knowledge-base";

export default w.skill({
  name: "knowledge-rag",
  description:
    "Answers general questions about SpaceCard products, benefits, fees, policies, and financial education. No authentication required.",
  prompt: "src/skills/knowledge-rag/prompt.md",
  tools: [queryKnowledgeBase],
});
