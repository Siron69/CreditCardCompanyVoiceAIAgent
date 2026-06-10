import { w } from "@wonderful/types/schema";
import authenticateCustomer from "../../tools/authenticate-customer";
import blockCard from "./tools/block-card";
import requestCardUnblock from "./tools/request-card-unblock";
import checkUnblockStatus from "./tools/check-unblock-status";
import reportSuspiciousTransaction from "./tools/report-suspicious-transaction";

export default w.skill({
  name: "fraud-disputes",
  description:
    "Handles fraud reports, card block/unblock requests, transaction disputes, and security alerts.",
  prompt: "src/skills/fraud-disputes/prompt.md",
  tools: [authenticateCustomer, blockCard, requestCardUnblock, checkUnblockStatus, reportSuspiciousTransaction],
});
