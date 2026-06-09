import { w } from "@wonderful/types/schema";
import accountServicing from "./skills/account-servicing";
import fraudDisputes from "./skills/fraud-disputes";
import knowledgeRag from "./skills/knowledge-rag";
import rewardsRedemption from "./skills/rewards-redemption";

const spacecardAgent = w.agent({
  name: "SpaceCard",
  description:
    "Assistente vocale SpaceCard — servizio clienti per carta di credito in italiano.",
  prompt: "src/agents/prompt.md",
  skills: [accountServicing, fraudDisputes, knowledgeRag, rewardsRedemption],
});

export default w.account({
  name: "spacecard",
  skills: [accountServicing, fraudDisputes, knowledgeRag, rewardsRedemption],
  agents: [spacecardAgent],
  envs: [],
});
