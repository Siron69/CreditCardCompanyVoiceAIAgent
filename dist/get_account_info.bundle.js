var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// src/skills/account-servicing/tools/get-account-info.ts
var import_schema = __toESM(require_schema());
var get_account_info_default = import_schema.w.tool({
  name: "get-account-info",
  description: "Retrieves the authenticated customer's account information: balance, credit limit, next payment date, minimum payment.",
  params: import_schema.s.object({}),
  handler: async (ctx, _params) => {
    try {
      const customerId = ctx.kv.exists("authenticated_customer_id") ? ctx.kv.get("authenticated_customer_id") : null;
      if (!customerId) {
        return { success: false, message: "Customer not authenticated. Please authenticate first." };
      }
      const apiUrl = ctx.globals.get("api_base_url");
      const rawSecret = ctx.secrets.get("WONDERFUL_SECRET_API_KEY");
      const apiKey = typeof rawSecret === "object" && rawSecret !== null ? rawSecret.value : rawSecret;
      const response = await fetch(`${apiUrl}/getaccountinfo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ customer_id: customerId })
      });
      if (!response.ok) {
        return { success: false, message: "Error retrieving account information. Please try again." };
      }
      const data = await response.json();
      return { success: true, ...data };
    } catch (err) {
      ctx.agent.sendSystemMessage("Unhandled error in get-account-info. Offer to transfer to a human agent.");
      return {
        success: false,
        message: "An unexpected error occurred. I'm transferring you to a human agent who can assist you."
      };
    }
  }
});

// dist/__get_account_info_wrapper.ts
async function main(ctx, params) {
  const toolParams = ctx?.data ?? params ?? {};
  return await get_account_info_default.handler(ctx, toolParams);
}
globalThis.main = main;
