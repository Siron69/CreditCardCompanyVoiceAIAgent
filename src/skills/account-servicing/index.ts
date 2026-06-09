import { w } from "@wonderful/types/schema";
import authenticateCustomer from "../../tools/authenticate-customer";
import getAccountInfo from "./tools/get-account-info";
import getTransactions from "./tools/get-transactions";
import updateContact from "./tools/update-contact";

export default w.skill({
  name: "account-servicing",
  description:
    "Gestisce tutte le operazioni sull'account: saldo, transazioni, pagamenti, aggiornamento contatti. Richiede autenticazione.",
  prompt: "src/skills/account-servicing/prompt.md",
  tools: [authenticateCustomer, getAccountInfo, getTransactions, updateContact],
});
