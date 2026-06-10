import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "authenticate-customer",
  description:
    "Authenticates the customer by verifying the last 4 digits of their card and their Italian tax code (codice fiscale). Must be called before any operation requiring account access. Persists authentication state in KV for the duration of the session.",
  params: s.object({
    last_four: s.string().describe("Last 4 digits of the customer's credit card"),
    codice_fiscale: s.string().describe("Customer's Italian tax code (codice fiscale, 16 characters)"),
  }),
  handler: async (ctx, params) => {
    try {
    const alreadyAuthenticated = ctx.kv.exists("authenticated_customer_id");
    if (alreadyAuthenticated) {
      const customerId = ctx.kv.get("authenticated_customer_id") as string;
      const customerName = ctx.kv.get("authenticated_customer_name") as string;
      return {
        success: true,
        already_authenticated: true,
        customer_id: customerId,
        customer_name: customerName,
        message: `Customer already authenticated: ${customerName}`,
      };
    }

    const failedAttempts = ctx.kv.exists("auth_failed_attempts") ? (ctx.kv.get("auth_failed_attempts") as number) : 0;
    if (failedAttempts >= 3) {
      ctx.agent.sendSystemMessage(
        "Customer has exceeded the maximum number of authentication attempts. Offer escalation to a human agent."
      );
      return {
        success: false,
        locked: true,
        message: "Too many failed attempts. For the security of your account, I am transferring you to an agent.",
      };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
    const apiKey = typeof rawSecret === "object" && rawSecret !== null
      ? (rawSecret as { value: string }).value
      : rawSecret as string;

    const response = await fetch(`${apiUrl}/getcustomerbyauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        last_four: params.last_four.trim(),
        codice_fiscale: params.codice_fiscale.trim().toUpperCase(),
      }),
    });

    if (!response.ok) {
      return { success: false, message: "A technical error occurred during verification. Please try again in a moment." };
    }

    const data = await response.json();
    const customer = data.customer ?? null;

    if (!customer) {
      const newFailedAttempts = failedAttempts + 1;
      ctx.kv.set("auth_failed_attempts", newFailedAttempts);
      const remainingAttempts = 3 - newFailedAttempts;

      if (remainingAttempts === 0) {
        ctx.agent.sendSystemMessage("Last attempt failed. Offer escalation to a human agent.");
        return {
          success: false,
          locked: true,
          message: "Incorrect details. For the security of your account, I am transferring you to an agent.",
        };
      }

      return {
        success: false,
        remaining_attempts: remainingAttempts,
        message: `Incorrect details. You have ${remainingAttempts} ${remainingAttempts === 1 ? "attempt" : "attempts"} remaining.`,
      };
    }

    ctx.kv.set("authenticated_customer_id", customer.id);
    ctx.kv.set("authenticated_customer_name", `${customer.first_name} ${customer.last_name}`);
    ctx.kv.set("authenticated_account_status", customer.account_status);
    ctx.kv.set("auth_failed_attempts", 0);

    if (customer.account_status === "blocked") {
      ctx.agent.sendSystemMessage("Customer authenticated but card is BLOCKED. Inform the customer and offer available options.");
    } else if (customer.account_status === "fraud_flag") {
      ctx.agent.sendSystemMessage("Customer authenticated but account has an active FRAUD FLAG. Handle with maximum caution.");
    } else if (customer.account_status === "expired") {
      ctx.agent.sendSystemMessage("Customer authenticated but card is EXPIRED. Inform the customer.");
    }

    return {
      success: true,
      customer_id: customer.id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      account_status: customer.account_status,
      message: `Authentication successful. Welcome, ${customer.first_name}.`,
    };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in authenticate-customer. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you.",
      };
    }
  },
});
