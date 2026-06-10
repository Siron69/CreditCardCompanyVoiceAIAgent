import { w } from "@wonderful/types/schema";
import accountServicing from "./skills/account-servicing";
import fraudDisputes from "./skills/fraud-disputes";
import knowledgeRag from "./skills/knowledge-rag";
import rewardsRedemption from "./skills/rewards-redemption";

const spacecardAgent = w.agent({
  name: "SpaceCard",
  description:
    "SpaceCard voice assistant — Italian-language credit card customer service.",
  prompt: "src/agents/prompt.md",
  skills: [accountServicing, fraudDisputes, knowledgeRag, rewardsRedemption],
});

const dev = w.env({
  name: "dev",
  url: "https://simonecert.api.dev.wonderful.cx",
  tenant: "simonecert",
});

export default w.account({
  name: "spacecard",
  skills: [accountServicing, fraudDisputes, knowledgeRag, rewardsRedemption],
  agents: [spacecardAgent],
  envs: [dev],
});
