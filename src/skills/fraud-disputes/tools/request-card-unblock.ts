import { s, w } from "@wonderful/types/schema";
import { spellForVoice } from "../../../lib/voice-spelling";

export default w.tool({
  name: "request-card-unblock",
  description:
    "Submits a card unblock request to the external review platform. Does NOT unblock automatically — the decision is made by a human reviewer.",
  params: s.object({
    customer_stated_reason: s.string().describe("The reason stated by the customer for requesting the unblock"),
    codice_fiscale: s.string().describe("Customer's codice fiscale (16 characters), required as additional identity verification for this sensitive operation — ask for it even if the customer is already authenticated"),
  }),
  handler: async (ctx, params) => {
    try {
      const customerId = ctx.kv.exists("authenticated_customer_id") ? (ctx.kv.get("authenticated_customer_id") as string) : null;
      const accountStatus = ctx.kv.exists("authenticated_account_status") ? (ctx.kv.get("authenticated_account_status") as string) : null;

      if (!customerId) {
        return { success: false, message: "Customer not authenticated. Please authenticate first." };
      }

      if (accountStatus !== "blocked") {
        return { success: false, message: "The card does not appear to be blocked. No request needed." };
      }

      // Step-up verification: this sensitive operation requires re-confirming
      // identity with the codice fiscale, even if already authenticated
      const cfAttempts = ctx.kv.exists("unblock_cf_attempts") ? (ctx.kv.get("unblock_cf_attempts") as number) : 0;
      if (cfAttempts >= 2) {
        ctx.agent.sendSystemMessage("Customer failed the codice fiscale step-up verification twice during an unblock request. Offer escalation to a human agent.");
        return { success: false, locked: true, message: "Identity verification failed too many times. For the security of your account, I am transferring you to an agent." };
      }

      // Read the customer's codice fiscale from the customers table
      // (the identifier lives in the `customer_id` data column)
      let storedCfRaw: string | null = null;
      try {
        const customerCheck = await ctx.tables.filter("customers", [
          { column: "customer_id", operator: "eq", value: customerId },
        ], 1);
        storedCfRaw = (customerCheck.rows[0]?.data?.codice_fiscale ?? null) as string | null;
      } catch (filterErr) {
        console.error("request-card-unblock: filter on customers failed:", filterErr);
      }

      if (storedCfRaw === null) {
        ctx.agent.sendSystemMessage(
          "request-card-unblock: could not read codice_fiscale from the customers table (check the table name, the codice_fiscale column, and whether the customer id matches the row id). Offer to retry or transfer to a human agent."
        );
        return { success: false, message: "A technical error occurred during the identity verification. Please try again in a moment." };
      }

      // Strip anything that is not a letter or digit — voice transcriptions
      // arrive with dots, hyphens and spaces in unpredictable places
      const storedCf = storedCfRaw.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const providedCf = params.codice_fiscale.toUpperCase().replace(/[^A-Z0-9]/g, "");

      if (!storedCf || storedCf !== providedCf) {
        const newCfAttempts = cfAttempts + 1;
        ctx.kv.set("unblock_cf_attempts", newCfAttempts);
        if (newCfAttempts >= 2) {
          ctx.agent.sendSystemMessage("Customer failed the codice fiscale step-up verification twice during an unblock request. Offer escalation to a human agent.");
          return { success: false, locked: true, message: "The codice fiscale does not match our records. For the security of your account, I am transferring you to an agent." };
        }
        return { success: false, message: "The codice fiscale does not match our records. Please check it and try once more." };
      }
      ctx.kv.set("unblock_cf_attempts", 0);

      const apiUrl = ctx.globals.get("api_base_url") as string;
      const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
      const apiKey = typeof rawSecret === "object" && rawSecret !== null
        ? (rawSecret as { value: string }).value
        : rawSecret as string;

      const accountResponse = await fetch(`${apiUrl}/getaccountinfo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ customer_id: customerId }),
      });

      if (!accountResponse.ok) {
        return { success: false, message: "Error retrieving account data. Please try again in a moment." };
      }

      const accountData = await accountResponse.json();

      const caseResponse = await fetch(`${apiUrl}/createunblockcase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          customer_id: customerId,
          card_last_four: accountData.last_four ?? "****",
          block_reason: accountData.block_reason ?? "not specified",
          customer_stated_reason: params.customer_stated_reason,
          interaction_id: ctx.metadata.communication.id ?? null,
          interaction_channel: ctx.metadata.communication.type ?? null,
        }),
      });

      if (!caseResponse.ok) {
        return { success: false, message: "Unable to submit the request. Please try again or contact support." };
      }

      const caseData = await caseResponse.json();
      ctx.kv.set("unblock_case_id", caseData.case_id);

      // Send SMS — wrapped in try/catch so a bad phone number never crashes the tool
      try {
        const fromNumber = ctx.metadata.communication.fromNumber;
        if (fromNumber && /^\+\d{7,15}$/.test(fromNumber)) {
          ctx.telephony.sendSms(fromNumber, `SpaceCard: Richiesta sblocco ricevuta (Rif: ${caseData.case_id}). Il team la esaminerà entro 24 ore lavorative.`);
        }
      } catch (_smsErr) {
        // SMS failure is non-blocking — case is already submitted
      }

      try {
        ctx.metadata.attachTag("card_unblock");
        ctx.metadata.attachTag("escalated_review");
      } catch (_tagErr) { /* tags may not exist yet */ }

      return {
        success: true,
        case_id: caseData.case_id,
        case_id_spelled: spellForVoice(String(caseData.case_id)),
        message: `Request submitted to the security team (reference: ${caseData.case_id}). You will receive a response within 24 hours. An SMS confirmation has been sent. On voice, if the customer asks to hear the reference, read the case_id_spelled value verbatim.`,
      };
    } catch (err) {
      console.error("request-card-unblock unhandled error:", err);
      ctx.agent.sendSystemMessage("Unhandled error in request-card-unblock. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
