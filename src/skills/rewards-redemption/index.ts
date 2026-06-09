import { w } from "@wonderful/types/schema";
import authenticateCustomer from "../../tools/authenticate-customer";
import getRewardsBalance from "./tools/get-rewards-balance";
import getRewardsCatalog from "./tools/get-rewards-catalog";
import redeemRewards from "./tools/redeem-rewards";

export default w.skill({
  name: "rewards-redemption",
  description:
    "Gestisce il programma fedeltà SpaceCard: saldo punti, catalogo premi, riscatti. Richiede autenticazione.",
  prompt: "src/skills/rewards-redemption/prompt.md",
  tools: [authenticateCustomer, getRewardsBalance, getRewardsCatalog, redeemRewards],
});
