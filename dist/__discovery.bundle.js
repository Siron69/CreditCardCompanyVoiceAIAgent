var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@wonderful/types/dist/schema.js
var require_schema = __commonJS({
  "node_modules/@wonderful/types/dist/schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WonderfulType = exports.w = exports.s = void 0;
    var WonderfulType = class {
      /**
          * This method is deprecated and doesn't do anything. don't use it.
          *
          * @deprecated this method doesn't do anything. don't use it.
      * */
      describe(description) {
        this._description = description;
        return this;
      }
      /** Safely validate a value, returning success/error */
      safeParse(value) {
        try {
          const data = this.parse(value);
          return { success: true, data };
        } catch (e) {
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      }
      /** Make this field optional */
      optional() {
        return new WonderfulOptional(this);
      }
    };
    exports.WonderfulType = WonderfulType;
    var WonderfulString = class extends WonderfulType {
      toJsonSchema() {
        return {
          type: "string",
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        if (typeof value !== "string") {
          throw new Error(`Expected string, got ${typeof value}`);
        }
        return value;
      }
    };
    var WonderfulNumber = class extends WonderfulType {
      toJsonSchema() {
        return {
          type: "number",
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        if (typeof value !== "number") {
          throw new Error(`Expected number, got ${typeof value}`);
        }
        return value;
      }
    };
    var WonderfulBoolean = class extends WonderfulType {
      toJsonSchema() {
        return {
          type: "boolean",
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        if (typeof value !== "boolean") {
          throw new Error(`Expected boolean, got ${typeof value}`);
        }
        return value;
      }
    };
    var WonderfulAny = class extends WonderfulType {
      toJsonSchema() {
        return {
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        return value;
      }
    };
    var WonderfulObject = class extends WonderfulType {
      constructor(shape) {
        super();
        this.shape = shape;
      }
      toJsonSchema() {
        const properties = {};
        const required = [];
        for (const [key, type] of Object.entries(this.shape)) {
          properties[key] = type.toJsonSchema();
          if (!(type instanceof WonderfulOptional)) {
            required.push(key);
          }
        }
        return {
          type: "object",
          properties,
          required: required.length > 0 ? required : void 0,
          additionalProperties: false,
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        if (typeof value !== "object" || value === null) {
          throw new Error(`Expected object, got ${typeof value}`);
        }
        const result = {};
        const obj = value;
        for (const [key, type] of Object.entries(this.shape)) {
          if (key in obj) {
            result[key] = type.parse(obj[key]);
          } else if (!(type instanceof WonderfulOptional)) {
            throw new Error(`Missing required field: ${key}`);
          }
        }
        return result;
      }
    };
    var WonderfulArray = class extends WonderfulType {
      constructor(itemType) {
        super();
        this.itemType = itemType;
      }
      toJsonSchema() {
        return {
          type: "array",
          items: this.itemType.toJsonSchema(),
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        if (!Array.isArray(value)) {
          throw new Error(`Expected array, got ${typeof value}`);
        }
        return value.map((item, index) => {
          try {
            return this.itemType.parse(item);
          } catch (e) {
            throw new Error(`Array item [${index}]: ${e instanceof Error ? e.message : String(e)}`);
          }
        });
      }
    };
    var WonderfulEnum = class extends WonderfulType {
      constructor(values) {
        super();
        this.values = values;
      }
      toJsonSchema() {
        return {
          type: "string",
          enum: [...this.values],
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        if (typeof value !== "string") {
          throw new Error(`Expected string, got ${typeof value}`);
        }
        if (!this.values.includes(value)) {
          throw new Error(`Expected one of [${this.values.join(", ")}], got "${value}"`);
        }
        return value;
      }
    };
    var WonderfulLiteral = class extends WonderfulType {
      constructor(value) {
        super();
        this.value = value;
      }
      toJsonSchema() {
        return {
          const: this.value,
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        if (value !== this.value) {
          throw new Error(`Expected ${JSON.stringify(this.value)}, got ${JSON.stringify(value)}`);
        }
        return value;
      }
    };
    var WonderfulOptional = class extends WonderfulType {
      constructor(innerType) {
        super();
        this.innerType = innerType;
      }
      toJsonSchema() {
        const schema = this.innerType.toJsonSchema();
        if (this._description) {
          return { ...schema, description: this._description };
        }
        return schema;
      }
      parse(value) {
        if (value === void 0 || value === null) {
          return void 0;
        }
        return this.innerType.parse(value);
      }
    };
    var WonderfulUnion = class extends WonderfulType {
      constructor(types) {
        super();
        this.types = types;
      }
      toJsonSchema() {
        return {
          oneOf: this.types.map((t) => t.toJsonSchema()),
          ...this._description && { description: this._description }
        };
      }
      parse(value) {
        const errors = [];
        for (const type of this.types) {
          const result = type.safeParse(value);
          if (result.success) {
            return result.data;
          }
          errors.push(result.error);
        }
        throw new Error(`Value did not match any union type: ${errors.join("; ")}`);
      }
    };
    exports.s = {
      /** String type */
      string: () => new WonderfulString(),
      /** Number type */
      number: () => new WonderfulNumber(),
      /** Boolean type */
      boolean: () => new WonderfulBoolean(),
      /** Any type (no validation, accepts anything) */
      any: () => new WonderfulAny(),
      /** Object type with defined shape */
      object: (shape) => new WonderfulObject(shape),
      /** Array type with item type */
      array: (itemType) => new WonderfulArray(itemType),
      /** Enum type (string values only) */
      enum: (...values) => new WonderfulEnum(values),
      /** Literal type (exact value) */
      literal: (value) => new WonderfulLiteral(value),
      /** Optional wrapper (makes a field optional) */
      optional: (type) => new WonderfulOptional(type),
      /** Union type (one of multiple types) */
      union: (...types) => new WonderfulUnion(types)
    };
    function tool(config) {
      return {
        name: config.name,
        description: config.description,
        trigger: config.trigger,
        params: config.params,
        handler: config.handler
      };
    }
    function skill(config) {
      return {
        name: config.name,
        description: config.description,
        tools: config.tools,
        prompt: config.prompt
      };
    }
    function agent(config) {
      return {
        name: config.name,
        description: config.description,
        skills: config.skills ?? [],
        prompt: config.prompt
      };
    }
    function env(config) {
      return {
        name: config.name,
        url: config.url,
        tenant: config.tenant
      };
    }
    function account(config) {
      return {
        name: config.name,
        skills: config.skills ?? [],
        tools: config.tools ?? [],
        agents: config.agents ?? [],
        envs: config.envs
      };
    }
    exports.w = {
      tool,
      skill,
      agent,
      env,
      account
    };
  }
});

// src/account.ts
var account_exports = {};
__export(account_exports, {
  default: () => account_default
});
var import_schema17 = __toESM(require_schema());

// src/skills/account-servicing/index.ts
var import_schema5 = __toESM(require_schema());

// src/tools/authenticate-customer.ts
var import_schema = __toESM(require_schema());
var authenticate_customer_default = import_schema.w.tool({
  name: "authenticate-customer",
  description: "Autentica il cliente verificando le ultime 4 cifre della carta e il codice fiscale. Deve essere chiamato prima di qualsiasi operazione che richiede accesso all'account. Persiste lo stato di autenticazione in KV per la durata della sessione.",
  params: import_schema.s.object({
    last_four: import_schema.s.string().describe("Ultime 4 cifre della carta di credito del cliente"),
    codice_fiscale: import_schema.s.string().describe("Codice fiscale del cliente (16 caratteri)")
  }),
  handler: async (ctx, params) => {
    const alreadyAuthenticated = ctx.kv.exists("authenticated_customer_id");
    if (alreadyAuthenticated) {
      const customerId = ctx.kv.get("authenticated_customer_id");
      const customerName = ctx.kv.get("authenticated_customer_name");
      return {
        success: true,
        already_authenticated: true,
        customer_id: customerId,
        customer_name: customerName,
        message: `Cliente già autenticato: ${customerName}`
      };
    }
    const failedAttempts = ctx.kv.get("auth_failed_attempts") ?? 0;
    if (failedAttempts >= 3) {
      ctx.agent.sendSystemMessage(
        "Il cliente ha superato il numero massimo di tentativi di autenticazione. Offri escalation a operatore umano."
      );
      return {
        success: false,
        locked: true,
        message: "Troppi tentativi falliti. Per la sicurezza del tuo account, ti trasferisco a un operatore."
      };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/getCustomerByAuth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        last_four: params.last_four.trim(),
        codice_fiscale: params.codice_fiscale.trim().toUpperCase()
      })
    });
    if (!response.ok) {
      return {
        success: false,
        message: "Si è verificato un errore tecnico durante la verifica. Riprova tra un momento."
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
          message: "Dati non corretti. Per la sicurezza del tuo account, ti trasferisco a un operatore."
        };
      }
      return {
        success: false,
        remaining_attempts: remainingAttempts,
        message: `Dati non corretti. Hai ancora ${remainingAttempts} ${remainingAttempts === 1 ? "tentativo" : "tentativi"}.`
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
      message: `Autenticazione riuscita. Benvenuto, ${customer.first_name}.`
    };
  }
});

// src/skills/account-servicing/tools/get-account-info.ts
var import_schema2 = __toESM(require_schema());
var get_account_info_default = import_schema2.w.tool({
  name: "get-account-info",
  description: "Recupera le informazioni dell'account del cliente autenticato: saldo, limite di credito, data prossimo pagamento, pagamento minimo.",
  params: import_schema2.s.object({}),
  handler: async (ctx, _params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/getAccountInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nel recupero delle informazioni. Riprova." };
    }
    const data = await response.json();
    return { success: true, ...data };
  }
});

// src/skills/account-servicing/tools/get-transactions.ts
var import_schema3 = __toESM(require_schema());
var get_transactions_default = import_schema3.w.tool({
  name: "get-transactions",
  description: "Recupera le transazioni recenti del cliente autenticato. Può filtrare per stato.",
  params: import_schema3.s.object({
    limit: import_schema3.s.optional(import_schema3.s.number()).describe("Numero massimo di transazioni (default: 10)"),
    status_filter: import_schema3.s.optional(import_schema3.s.string()).describe("Filtra per stato: completata, in_attesa, contestata, frode")
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/getTransactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        limit: params.limit ?? 10,
        status_filter: params.status_filter ?? null
      })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nel recupero delle transazioni. Riprova." };
    }
    const data = await response.json();
    return { success: true, transactions: data.transactions ?? [] };
  }
});

// src/skills/account-servicing/tools/update-contact.ts
var import_schema4 = __toESM(require_schema());
var update_contact_default = import_schema4.w.tool({
  name: "update-contact",
  description: "Aggiorna email o numero di telefono del cliente autenticato.",
  params: import_schema4.s.object({
    email: import_schema4.s.optional(import_schema4.s.string()).describe("Nuovo indirizzo email"),
    phone: import_schema4.s.optional(import_schema4.s.string()).describe("Nuovo numero di telefono italiano (es. +39 333 1234567)")
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    if (!params.email && !params.phone) {
      return { success: false, message: "Specifica almeno un dato da aggiornare (email o telefono)." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/updateContactInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, email: params.email ?? null, phone: params.phone ?? null })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nell'aggiornamento. Riprova o contatta il supporto." };
    }
    const updated = [];
    if (params.email) updated.push(`email: ${params.email}`);
    if (params.phone) updated.push(`telefono: ${params.phone}`);
    return { success: true, message: `Dati aggiornati correttamente: ${updated.join(", ")}.` };
  }
});

// src/skills/account-servicing/index.ts
var account_servicing_default = import_schema5.w.skill({
  name: "account-servicing",
  description: "Gestisce tutte le operazioni sull'account: saldo, transazioni, pagamenti, aggiornamento contatti. Richiede autenticazione.",
  prompt: "src/skills/account-servicing/prompt.md",
  tools: [authenticate_customer_default, get_account_info_default, get_transactions_default, update_contact_default]
});

// src/skills/fraud-disputes/index.ts
var import_schema10 = __toESM(require_schema());

// src/skills/fraud-disputes/tools/block-card.ts
var import_schema6 = __toESM(require_schema());
var block_card_default = import_schema6.w.tool({
  name: "block-card",
  description: "Blocca immediatamente la carta del cliente autenticato. Invia SMS di conferma.",
  params: import_schema6.s.object({
    reason: import_schema6.s.string().describe("Motivo del blocco: 'smarrita', 'rubata', 'transazioni_sospette', 'altro'")
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/blockCard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, reason: params.reason })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nel blocco della carta. Riprova o contatta il supporto." };
    }
    const data = await response.json();
    ctx.kv.set("authenticated_account_status", "blocked");
    const fromNumber = ctx.metadata.communication.fromNumber;
    if (fromNumber) {
      ctx.telephony.sendSms(fromNumber, `SpaceCard: La tua carta è stata bloccata. Per sbloccarla chiama il numero verde o accedi all'app. Rif: ${customerId}`);
    }
    return { success: true, blocked_at: data.blocked_at, message: "Carta bloccata con successo. Riceverai un SMS di conferma. Per richiedere lo sblocco sarà necessaria una verifica aggiuntiva." };
  }
});

// src/skills/fraud-disputes/tools/request-card-unblock.ts
var import_schema7 = __toESM(require_schema());
var request_card_unblock_default = import_schema7.w.tool({
  name: "request-card-unblock",
  description: "Invia una richiesta di sblocco carta alla piattaforma di review esterna. NON sblocca automaticamente — la decisione spetta a un operatore umano.",
  params: import_schema7.s.object({
    customer_stated_reason: import_schema7.s.string().describe("Motivo dichiarato dal cliente per richiedere lo sblocco")
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    const accountStatus = ctx.kv.get("authenticated_account_status");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    if (accountStatus !== "blocked") {
      return { success: false, message: "La carta non risulta bloccata. Nessuna richiesta necessaria." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const accountResponse = await fetch(`${apiUrl}/getAccountInfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId })
    });
    if (!accountResponse.ok) {
      return { success: false, message: "Errore nel recupero dati. Riprova tra un momento." };
    }
    const accountData = await accountResponse.json();
    const caseResponse = await fetch(`${apiUrl}/createUnblockCase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        card_last_four: accountData.last_four ?? "****",
        block_reason: accountData.block_reason ?? "non specificato",
        customer_stated_reason: params.customer_stated_reason
      })
    });
    if (!caseResponse.ok) {
      return { success: false, message: "Impossibile inviare la richiesta. Riprova o contatta il supporto." };
    }
    const caseData = await caseResponse.json();
    ctx.kv.set("unblock_case_id", caseData.case_id);
    const fromNumber = ctx.metadata.communication.fromNumber;
    if (fromNumber) {
      ctx.telephony.sendSms(fromNumber, `SpaceCard: Richiesta sblocco ricevuta (Rif: ${caseData.case_id}). Il team la esaminerà entro 24 ore lavorative.`);
    }
    return { success: true, case_id: caseData.case_id, message: `Richiesta inviata al team di sicurezza (riferimento: ${caseData.case_id}). Riceverai risposta entro 24 ore. Ti è stato inviato un SMS di conferma.` };
  }
});

// src/skills/fraud-disputes/tools/check-unblock-status.ts
var import_schema8 = __toESM(require_schema());
var check_unblock_status_default = import_schema8.w.tool({
  name: "check-unblock-status",
  description: "Verifica lo stato di una richiesta di sblocco carta precedentemente inviata.",
  params: import_schema8.s.object({
    case_id: import_schema8.s.optional(import_schema8.s.string()).describe("ID del caso. Se omesso, usa quello della sessione corrente.")
  }),
  handler: async (ctx, params) => {
    const caseId = params.case_id ?? ctx.kv.get("unblock_case_id");
    if (!caseId) {
      return { success: false, message: "Nessuna richiesta di sblocco trovata. Fornisci il numero di riferimento ricevuto via SMS." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/getUnblockCaseStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nella verifica dello stato. Riprova." };
    }
    const data = await response.json();
    const messages = {
      pending: "La tua richiesta è ancora in esame. Ti contatteremo entro 24 ore lavorative.",
      approved: "Ottima notizia! La tua richiesta è stata approvata. La tua carta è ora attiva.",
      denied: `La tua richiesta non è stata approvata.${data.reviewer_notes ? ` Nota: ${data.reviewer_notes}` : ""} Per assistenza puoi parlare con un operatore.`
    };
    return { success: true, status: data.status, reviewer_notes: data.reviewer_notes ?? null, message: messages[data.status] ?? "Stato non riconosciuto. Contatta il supporto." };
  }
});

// src/skills/fraud-disputes/tools/report-suspicious-transaction.ts
var import_schema9 = __toESM(require_schema());
var report_suspicious_transaction_default = import_schema9.w.tool({
  name: "report-suspicious-transaction",
  description: "Segnala una transazione come sospetta o fraudolenta e apre una disputa.",
  params: import_schema9.s.object({
    transaction_id: import_schema9.s.string().describe("ID della transazione da contestare"),
    reason: import_schema9.s.string().describe("Motivo: 'non_riconosciuta', 'importo_errato', 'merce_non_ricevuta', 'frode', 'altro'")
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/reportSuspiciousTransaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, transaction_id: params.transaction_id, reason: params.reason })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nella segnalazione. Riprova o contatta il supporto." };
    }
    const data = await response.json();
    return { success: true, dispute_id: data.dispute_id, message: `Transazione contestata (rif. disputa: ${data.dispute_id}). Riceverai aggiornamenti via email entro 5 giorni lavorativi.` };
  }
});

// src/skills/fraud-disputes/index.ts
var fraud_disputes_default = import_schema10.w.skill({
  name: "fraud-disputes",
  description: "Gestisce segnalazioni frode, blocco/sblocco carta, dispute su transazioni e alert sicurezza.",
  prompt: "src/skills/fraud-disputes/prompt.md",
  tools: [authenticate_customer_default, block_card_default, request_card_unblock_default, check_unblock_status_default, report_suspicious_transaction_default]
});

// src/skills/knowledge-rag/index.ts
var import_schema12 = __toESM(require_schema());

// src/skills/knowledge-rag/tools/query-knowledge-base.ts
var import_schema11 = __toESM(require_schema());
var query_knowledge_base_default = import_schema11.w.tool({
  name: "query-knowledge-base",
  description: "Cerca nella knowledge base SpaceCard per rispondere a domande generali su benefici, commissioni, tassi APR, programmi rewards, processi di richiesta, policy e educazione finanziaria. Non richiede autenticazione.",
  params: import_schema11.s.object({
    query: import_schema11.s.string().describe("La domanda o l'argomento da cercare nella knowledge base")
  }),
  handler: async (ctx, params) => {
    const knowledgeBaseId = ctx.globals.get("knowledge_base_id");
    const results = await ctx.tools.callRag(knowledgeBaseId, params.query);
    if (!results || Array.isArray(results) && results.length === 0) {
      return { success: false, message: "Non ho trovato informazioni su questo argomento. Posso trasferirla a un operatore specializzato." };
    }
    return { success: true, results };
  }
});

// src/skills/knowledge-rag/index.ts
var knowledge_rag_default = import_schema12.w.skill({
  name: "knowledge-rag",
  description: "Risponde a domande generali su prodotti SpaceCard, benefici, commissioni, policy e educazione finanziaria. Non richiede autenticazione.",
  prompt: "src/skills/knowledge-rag/prompt.md",
  tools: [query_knowledge_base_default]
});

// src/skills/rewards-redemption/index.ts
var import_schema16 = __toESM(require_schema());

// src/skills/rewards-redemption/tools/get-rewards-balance.ts
var import_schema13 = __toESM(require_schema());
var get_rewards_balance_default = import_schema13.w.tool({
  name: "get-rewards-balance",
  description: "Recupera il saldo punti fedeltà, il tier e la data di scadenza punti del cliente autenticato.",
  params: import_schema13.s.object({}),
  handler: async (ctx, _params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/getRewardsBalance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nel recupero dei punti. Riprova." };
    }
    const data = await response.json();
    if (data.points_expiry_date) {
      const expiry = new Date(data.points_expiry_date);
      const today = /* @__PURE__ */ new Date();
      const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
      if (daysToExpiry <= 30 && daysToExpiry > 0) {
        ctx.agent.sendSystemMessage(`ATTENZIONE: I punti del cliente scadono tra ${daysToExpiry} giorni. Suggerisci di riscattarli.`);
      }
    }
    return { success: true, ...data };
  }
});

// src/skills/rewards-redemption/tools/get-rewards-catalog.ts
var import_schema14 = __toESM(require_schema());
var get_rewards_catalog_default = import_schema14.w.tool({
  name: "get-rewards-catalog",
  description: "Recupera il catalogo premi disponibili per il riscatto punti. Non richiede autenticazione.",
  params: import_schema14.s.object({}),
  handler: async (ctx, _params) => {
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/getRewardsCatalog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      return { success: false, message: "Errore nel recupero del catalogo. Riprova." };
    }
    const data = await response.json();
    return { success: true, catalog: data.rewards ?? [] };
  }
});

// src/skills/rewards-redemption/tools/redeem-rewards.ts
var import_schema15 = __toESM(require_schema());
var redeem_rewards_default = import_schema15.w.tool({
  name: "redeem-rewards",
  description: "Riscatta punti fedeltà per un premio scelto dal cliente. Chiede conferma prima di procedere.",
  params: import_schema15.s.object({
    reward_id: import_schema15.s.string().describe("ID del premio da riscattare"),
    reward_name: import_schema15.s.string().describe("Nome del premio (per conferma vocale)"),
    confirmed: import_schema15.s.boolean().describe("true se il cliente ha già confermato, false per chiedere conferma")
  }),
  handler: async (ctx, params) => {
    const customerId = ctx.kv.get("authenticated_customer_id");
    if (!customerId) {
      return { success: false, message: "Cliente non autenticato. Esegui prima l'autenticazione." };
    }
    if (!params.confirmed) {
      return { success: false, needs_confirmation: true, message: `Stai per riscattare: ${params.reward_name}. Confermi di voler procedere?` };
    }
    const apiUrl = ctx.globals.get("api_base_url");
    const response = await fetch(`${apiUrl}/redeemReward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, reward_id: params.reward_id })
    });
    if (!response.ok) {
      return { success: false, message: "Errore nel riscatto. Riprova o contatta il supporto." };
    }
    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.message ?? "Punti insufficienti o premio non disponibile." };
    }
    return { success: true, points_used: data.points_used, remaining_balance: data.remaining_balance, message: `Riscatto completato! Hai utilizzato ${data.points_used} punti per ${params.reward_name}. Saldo residuo: ${data.remaining_balance} punti.` };
  }
});

// src/skills/rewards-redemption/index.ts
var rewards_redemption_default = import_schema16.w.skill({
  name: "rewards-redemption",
  description: "Gestisce il programma fedeltà SpaceCard: saldo punti, catalogo premi, riscatti. Richiede autenticazione.",
  prompt: "src/skills/rewards-redemption/prompt.md",
  tools: [authenticate_customer_default, get_rewards_balance_default, get_rewards_catalog_default, redeem_rewards_default]
});

// src/account.ts
var spacecardAgent = import_schema17.w.agent({
  name: "SpaceCard",
  description: "Assistente vocale SpaceCard — servizio clienti per carta di credito in italiano.",
  prompt: "src/agents/prompt.md",
  skills: [account_servicing_default, fraud_disputes_default, knowledge_rag_default, rewards_redemption_default]
});
var account_default = import_schema17.w.account({
  name: "spacecard",
  skills: [account_servicing_default, fraud_disputes_default, knowledge_rag_default, rewards_redemption_default],
  agents: [spacecardAgent],
  envs: []
});

// dist/__discovery.ts
var candidates = [
  { path: "src/account.ts", mod: account_exports }
];
function isObject(value) {
  return value !== null && typeof value === "object";
}
function isAccount(value) {
  return isObject(value) && typeof value.name === "string" && Array.isArray(value.tools) && Array.isArray(value.skills) && Array.isArray(value.envs);
}
function isAgent(value) {
  return isObject(value) && typeof value.name === "string" && Array.isArray(value.skills);
}
function paramsSignature(params) {
  if (params === void 0) {
    return "undefined";
  }
  if (params === null) {
    return "null";
  }
  if (typeof params === "string") {
    return params;
  }
  if (params?.toJsonSchema) {
    try {
      return JSON.stringify(params.toJsonSchema());
    } catch (e) {
      return null;
    }
  }
  try {
    const json = JSON.stringify(params);
    return typeof json === "string" ? json : null;
  } catch (e) {
    return null;
  }
}
function handlerSignature(handler) {
  if (handler === void 0) {
    return "undefined";
  }
  if (handler === null) {
    return "null";
  }
  if (typeof handler === "function") {
    try {
      return handler.toString();
    } catch (e) {
      return null;
    }
  }
  try {
    const json = JSON.stringify(handler);
    return typeof json === "string" ? json : String(handler);
  } catch (e) {
    return String(handler);
  }
}
function toolSignature(tool) {
  if (!isObject(tool) || typeof tool.name !== "string") {
    return null;
  }
  const description = typeof tool.description === "string" ? tool.description : null;
  const params = paramsSignature(tool.params);
  const trigger = typeof tool.trigger === "string" ? tool.trigger : null;
  const handler = handlerSignature(tool.handler);
  if (params === null || handler === null) {
    return null;
  }
  return JSON.stringify({
    name: tool.name,
    description,
    trigger,
    params,
    handler
  });
}
function toolEquals(a, b) {
  const aSignature = toolSignature(a);
  const bSignature = toolSignature(b);
  return aSignature !== null && bSignature !== null && aSignature === bSignature;
}
function groupTools(tools) {
  const groups = /* @__PURE__ */ new Map();
  for (const tool of tools) {
    if (!isObject(tool) || typeof tool.name !== "string") {
      return null;
    }
    const list = groups.get(tool.name) ?? [];
    list.push(tool);
    groups.set(tool.name, list);
  }
  return groups;
}
function toolListsEqual(aTools, bTools) {
  const groupsA = groupTools(aTools);
  const groupsB = groupTools(bTools);
  if (!groupsA || !groupsB) {
    return false;
  }
  if (groupsA.size !== groupsB.size) {
    return false;
  }
  for (const [name, listA] of groupsA.entries()) {
    const listB = groupsB.get(name);
    if (!listB || listA.length !== listB.length) {
      return false;
    }
    const matched = new Array(listB.length).fill(false);
    for (const toolA of listA) {
      let found = false;
      for (let i = 0; i < listB.length; i++) {
        if (matched[i]) {
          continue;
        }
        if (toolEquals(toolA, listB[i])) {
          matched[i] = true;
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
  }
  return true;
}
function skillEquals(a, b) {
  if (!isObject(a) || !isObject(b)) {
    return false;
  }
  if (a.name !== b.name) {
    return false;
  }
  if (a.description !== b.description) {
    return false;
  }
  const promptA = typeof a.prompt === "string" ? a.prompt : null;
  const promptB = typeof b.prompt === "string" ? b.prompt : null;
  if (promptA !== promptB) {
    return false;
  }
  const toolsA = Array.isArray(a.tools) ? a.tools : [];
  const toolsB = Array.isArray(b.tools) ? b.tools : [];
  return toolListsEqual(toolsA, toolsB);
}
function validateSkills(skills, accountPath) {
  const skillsByName = /* @__PURE__ */ new Map();
  for (const skill of skills) {
    if (!isObject(skill) || typeof skill.name !== "string") {
      continue;
    }
    const existing = skillsByName.get(skill.name);
    if (!existing) {
      skillsByName.set(skill.name, skill);
      continue;
    }
    if (!skillEquals(existing, skill)) {
      const error = new Error(
        `Skill "${skill.name}" is defined multiple times with different definitions in ${accountPath}.`
      );
      error.code = "SKILL_CONFLICT";
      throw error;
    }
  }
}
function validateAgents(agents, accountPath) {
  const agentsByName = /* @__PURE__ */ new Map();
  for (const agent of agents) {
    if (!isObject(agent) || typeof agent.name !== "string") {
      continue;
    }
    const existing = agentsByName.get(agent.name);
    if (!existing) {
      agentsByName.set(agent.name, agent);
      continue;
    }
    if (!agentEquals(existing, agent)) {
      const error = new Error(
        `Agent "${agent.name}" is defined multiple times with different definitions in ${accountPath}.`
      );
      error.code = "AGENT_CONFLICT";
      throw error;
    }
  }
}
function agentEquals(a, b) {
  if (!isObject(a) || !isObject(b)) {
    return false;
  }
  if (a.name !== b.name) {
    return false;
  }
  if (a.description !== b.description) {
    return false;
  }
  const promptA = typeof a.prompt === "string" ? a.prompt : null;
  const promptB = typeof b.prompt === "string" ? b.prompt : null;
  if (promptA !== promptB) {
    return false;
  }
  const skillsA = Array.isArray(a.skills) ? a.skills : [];
  const skillsB = Array.isArray(b.skills) ? b.skills : [];
  return namedEntityListsEqual(skillsA, skillsB);
}
function namedEntityListsEqual(a, b) {
  const namesA = a.filter((entry) => isObject(entry) && typeof entry.name === "string").map((entry) => entry.name).sort();
  const namesB = b.filter((entry) => isObject(entry) && typeof entry.name === "string").map((entry) => entry.name).sort();
  if (namesA.length !== namesB.length) {
    return false;
  }
  return namesA.every((name, index) => name === namesB[index]);
}
function toToolMetadata(tool) {
  if (!isObject(tool) || typeof tool.name !== "string" || typeof tool.description !== "string") {
    return null;
  }
  let paramsSchema = "{}";
  if (typeof tool.params === "string") {
    paramsSchema = tool.params;
  } else if (tool.params?.toJsonSchema) {
    try {
      paramsSchema = JSON.stringify(tool.params.toJsonSchema());
    } catch (e) {
      paramsSchema = "{}";
    }
  }
  return {
    name: tool.name,
    description: tool.description,
    params: paramsSchema,
    trigger: typeof tool.trigger === "string" ? tool.trigger : null
  };
}
function collectTools(account, accountPath) {
  const toolsByName = /* @__PURE__ */ new Map();
  const addTool = (tool) => {
    if (!isObject(tool) || typeof tool.name !== "string") {
      return;
    }
    const metadata = toToolMetadata(tool);
    const signature = toolSignature(tool);
    const existing = toolsByName.get(tool.name);
    if (!existing) {
      toolsByName.set(tool.name, { tool, metadata, signature });
      return;
    }
    if (!existing.signature || !signature || existing.signature !== signature) {
      const error = new Error(
        `Tool "${tool.name}" is defined multiple times with different definitions in ${accountPath}.`
      );
      error.code = "TOOL_CONFLICT";
      throw error;
    }
    if (!existing.metadata && metadata) {
      existing.metadata = metadata;
    }
  };
  for (const tool of account.tools) {
    addTool(tool);
  }
  for (const skill of account.skills) {
    if (isObject(skill) && Array.isArray(skill.tools)) {
      for (const tool of skill.tools) {
        addTool(tool);
      }
      continue;
    }
    const metadata = toSkillMetadata(skill);
    if (!metadata) {
      continue;
    }
    for (const tool of metadata.tools) {
      addTool(tool);
    }
  }
  return Array.from(toolsByName.values(), (entry) => entry.metadata).filter(
    (metadata) => metadata !== null
  );
}
function toSkillMetadata(skill) {
  if (!isObject(skill) || typeof skill.name !== "string" || typeof skill.description !== "string") {
    return null;
  }
  const tools = Array.isArray(skill.tools) ? skill.tools.map(toToolMetadata).filter((t) => t !== null) : [];
  return {
    name: skill.name,
    description: skill.description,
    tools,
    prompt: typeof skill.prompt === "string" ? skill.prompt : null
  };
}
function toEnvironmentMetadata(env) {
  if (!isObject(env) || typeof env.name !== "string" || typeof env.url !== "string" || typeof env.tenant !== "string") {
    return null;
  }
  return {
    name: env.name,
    url: env.url,
    tenant: env.tenant
  };
}
function toAgentMetadata(agent) {
  if (!isAgent(agent)) {
    return null;
  }
  const skills = agent.skills.filter((s13) => isObject(s13) && typeof s13.name === "string").map((s13) => s13.name);
  return {
    name: agent.name,
    description: typeof agent.description === "string" ? agent.description : null,
    skills,
    prompt: typeof agent.prompt === "string" ? agent.prompt : null
  };
}
async function main(ctx, params) {
  const results = [];
  for (const { path, mod } of candidates) {
    try {
      const exports = isObject(mod) ? Object.values(mod) : [];
      for (const value of exports) {
        if (!isAccount(value)) {
          continue;
        }
        validateSkills(value.skills, path);
        const accountAgents = Array.isArray(value.agents) ? value.agents : [];
        validateAgents(accountAgents, path);
        const tools = collectTools(value, path);
        const skills = value.skills.map(toSkillMetadata).filter((s13) => s13 !== null);
        const agents = accountAgents.map(toAgentMetadata).filter((a) => a !== null);
        const envs = value.envs.map(toEnvironmentMetadata).filter((e) => e !== null);
        results.push({
          name: value.name,
          file: path,
          tools,
          skills,
          agents,
          envs
        });
      }
    } catch (e) {
      const code = isObject(e) ? e.code : void 0;
      if (code === "TOOL_CONFLICT" || code === "SKILL_CONFLICT" || code === "AGENT_CONFLICT") {
        throw e;
      }
      console.error(`Failed to load ${path}:`, e);
    }
  }
  return results;
}
globalThis.main = main;
