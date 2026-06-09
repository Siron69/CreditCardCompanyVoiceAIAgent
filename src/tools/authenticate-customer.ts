import { s, w } from "@wonderful/types/schema";

export default w.tool({
  name: "authenticate-customer",
  description:
    "Autentica il cliente verificando le ultime 4 cifre della carta e il codice fiscale. Deve essere chiamato prima di qualsiasi operazione che richiede accesso all'account. Persiste lo stato di autenticazione in KV per la durata della sessione.",
  params: s.object({
    last_four: s.string().describe("Ultime 4 cifre della carta di credito del cliente"),
    codice_fiscale: s.string().describe("Codice fiscale del cliente (16 caratteri)"),
  }),
  handler: async (ctx, params) => {
    const alreadyAuthenticated = ctx.kv.exists("authenticated_customer_id");
    if (alreadyAuthenticated) {
      const customerId = ctx.kv.get("authenticated_customer_id") as string;
      const customerName = ctx.kv.get("authenticated_customer_name") as string;
      return {
        success: true,
        already_authenticated: true,
        customer_id: customerId,
        customer_name: customerName,
        message: `Cliente già autenticato: ${customerName}`,
      };
    }

    const failedAttempts = (ctx.kv.get("auth_failed_attempts") as number) ?? 0;
    if (failedAttempts >= 3) {
      ctx.agent.sendSystemMessage(
        "Il cliente ha superato il numero massimo di tentativi di autenticazione. Offri escalation a operatore umano."
      );
      return {
        success: false,
        locked: true,
        message: "Troppi tentativi falliti. Per la sicurezza del tuo account, ti trasferisco a un operatore.",
      };
    }

    const apiUrl = ctx.globals.get("api_base_url") as string;
    const response = await fetch(`${apiUrl}/getCustomerByAuth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        last_four: params.last_four.trim(),
        codice_fiscale: params.codice_fiscale.trim().toUpperCase(),
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Si è verificato un errore tecnico durante la verifica. Riprova tra un momento.",
      };
    }

    const data = await response.json();
    const customer = data.customer ?? null;

    if (!customer) {
      const newFailedAttempts = failedAttempts + 1;
      ctx.kv.set("auth_failed_attempts", newFailedAttempts);
      const remainingAttempts = 3 - newFailedAttempts;

      if (remainingAttempts === 0) {
        ctx.agent.sendSystemMessage("Ultimo tentativo fallito. Offri escalation a operatore umano.");
        return {
          success: false,
          locked: true,
          message: "Dati non corretti. Per la sicurezza del tuo account, ti trasferisco a un operatore.",
        };
      }

      return {
        success: false,
        remaining_attempts: remainingAttempts,
        message: `Dati non corretti. Hai ancora ${remainingAttempts} ${remainingAttempts === 1 ? "tentativo" : "tentativi"}.`,
      };
    }

    ctx.kv.set("authenticated_customer_id", customer.id);
    ctx.kv.set("authenticated_customer_name", `${customer.first_name} ${customer.last_name}`);
    ctx.kv.set("authenticated_account_status", customer.account_status);
    ctx.kv.set("auth_failed_attempts", 0);

    if (customer.account_status === "blocked") {
      ctx.agent.sendSystemMessage("Cliente autenticato ma carta BLOCCATA. Informa il cliente e offri le opzioni disponibili.");
    } else if (customer.account_status === "fraud_flag") {
      ctx.agent.sendSystemMessage("Cliente autenticato ma account con FLAG FRODE attivo. Tratta con massima cautela.");
    } else if (customer.account_status === "expired") {
      ctx.agent.sendSystemMessage("Cliente autenticato ma carta SCADUTA. Informa il cliente.");
    }

    return {
      success: true,
      customer_id: customer.id,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      account_status: customer.account_status,
      message: `Autenticazione riuscita. Benvenuto, ${customer.first_name}.`,
    };
  },
});
