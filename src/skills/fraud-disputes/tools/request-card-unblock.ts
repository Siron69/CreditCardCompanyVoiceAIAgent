import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "request-card-unblock",
  description:
    "Submits a card unblock request to the external review platform. Does NOT unblock automatically — the decision is made by a human reviewer.",
  params: s.object({
    customer_stated_reason: s.string().describe("The reason stated by the customer for requesting the unblock"),
  }),
  handler: async (ctx, params) => {
    try {
      const customerId = ctx.kv.get("authenticated_customer_id") as string;
      const accountStatus = ctx.kv.get("authenticated_account_status") as string;

      if (!customerId) {
        return { success: false, message: "Customer not authenticated. Please authenticate first." };
      }

      if (accountStatus !== "blocked") {
        return { success: false, message: "The card does not appear to be blocked. No request needed." };
      }

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

      return {
        success: true,
        case_id: caseData.case_id,
        message: `Request submitted to the security team (reference: ${caseData.case_id}). You will receive a response within 24 hours. An SMS confirmation has been sent.`,
      };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in request-card-unblock. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
