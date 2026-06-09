# Wonderful Tool Project

This is a Wonderful tool project for building voice agent tools and skills.

## Project Structure

- `account.ts` - Main account definition (entry point)
- `*.ts` - Tool and skill files
- `.wonderful/` - CLI cache (gitignored)

## SDK Reference (`@wonderful/types/schema`)

Import the schema builder `s` and definition builder `w`:

```typescript
import { s, w } from "@wonderful/types/schema";
```

### Schema Builder (`s`)

```typescript
s.string()              // String type
s.number()              // Number type
s.boolean()             // Boolean type
s.any()                 // Any value
s.object({ ... })       // Object with named fields
s.array(s.string())     // Array of items
s.enum("a", "b", "c")  // String enum
s.literal("value")      // Exact literal value
s.optional(s.string())  // Optional field
s.union(s.string(), s.number()) // Union type
```

All types support `.describe("...")` for documentation.

### Tool Definition (`w.tool`)

```typescript
export default w.tool({
  name: "my-tool",
  description: "What this tool does",
  params: s.object({
    query: s.string().describe("Search query"),
  }),
  handler: async (ctx, params) => {
    return { result: "value" };
  },
});
```

### Skill Definition (`w.skill`)

```typescript
export default w.skill({
  name: "my-skill",
  description: "What this skill does",
  prompt: "skills/my_skill_prompt.md",
  tools: [myTool, anotherTool],
});
```

### Agent Definition (`w.agent`)

```typescript
export default w.agent({
  name: "my-agent",
  description: "What this agent does",
  prompt: "agents/my_agent_prompt.md",
  skills: [mySkill, anotherSkill],
});
```

### Account Definition (`w.account`)

```typescript
export default w.account({
  name: "my-account",
  skills: [mySkill],
  agents: [myAgent],
  envs: [],
});
```

### Environment Definition (`w.env`)

```typescript
const prod = w.env({
  name: "production",
  url: "https://api.example.com",
  tenant: "my-tenant-id",
});

export default w.account({
  name: "my-account",
  skills: [mySkill],
  envs: [prod],
});
```

### Tool Triggers

Tools can be triggered by conversation events instead of agent invocation:

```typescript
w.tool({
  name: "on-call-start",
  trigger: "OnStart",  // Called when the call begins
  // ...
});
```

Available triggers: `Agent` (default), `OnStart`, `OnEnd`, `OnEnhancedFinished`, `OnUserTranscription`, `OnAgentTranscription`, `OnBeforeUserMessage`, `OnBeforeFirstMessage`, `OnAfterFirstMessage`, `OnUserFinishedHearing`, `OnUserInterruption`, `OnToolCall`.

## Tool Context (`ctx`)

The `ctx` object provides access to runtime services in every tool handler.

### Key-Value Store (`ctx.kv`)

Session-scoped storage shared across tools in a call:

```typescript
ctx.kv.set("user_name", "Alice");
ctx.kv.get("user_name");              // "Alice"
ctx.kv.exists("user_name");           // true
ctx.kv.delete("user_name");
ctx.kv.setIfNotExist("key", "val");   // true if set, false if already exists
ctx.kv.deleteIfEqual("key", "val");   // true if deleted, false if value differs
```

### Secrets (`ctx.secrets`) & Globals (`ctx.globals`)

```typescript
const apiKey = ctx.secrets.get("my-api-key");
const config = ctx.globals.get("my-config");
```

### Metadata (`ctx.metadata`)

```typescript
ctx.metadata.tenantId
ctx.metadata.communication.id          // Call ID
ctx.metadata.communication.toNumber    // Destination number
ctx.metadata.communication.fromNumber  // Caller number
ctx.metadata.communication.direction   // "inbound" | "outbound"
ctx.metadata.agent.id
ctx.metadata.agent.name
ctx.metadata.agent.language
ctx.metadata.agent.timeZone
ctx.metadata.attachTag("vip")
ctx.metadata.detachTag("vip")
```

### Agent Control (`ctx.agent`)

```typescript
ctx.agent.announce("I'll look that up", { interruptible: true });
ctx.agent.forceAnnounce("Important notice");
ctx.agent.sendSystemMessage("User is a VIP customer");
ctx.agent.switchSkill("billing", { force: true });
ctx.agent.changeSpeed(1); // -2 to 2
ctx.agent.declareGender("female");
ctx.agent.getGender(); // "male" | "female" | "unknown"
ctx.agent.correctTranscription("corrected text");
```

### Telephony (`ctx.telephony`)

```typescript
ctx.telephony.sendSms("+1234567890", "Your code is 1234");
ctx.telephony.forward("+1234567890");
ctx.telephony.end();
```

### Other Context APIs

| API | Description |
|-----|-------------|
| `ctx.email.send(to, subject, body)` | Send email |
| `ctx.session.getTranscription()` | Get call transcript — returns `[{ id, speaker, text, createdAt, startTime?, endTime?, interruptedAtCharIndex?, confidence?, toolDetails? }]` |
| `ctx.session.forward(number)` | Forward session |
| `ctx.tools.call(name, params)` | Call another tool |
| `ctx.tools.callRag(kb, query)` | Query a knowledge base |
| `ctx.attachments.listFiles()` | List file attachments |
| `ctx.attachments.getFile(id)` | Get file content |
| `ctx.attachments.uploadFile(name, data)` | Upload a file |

## LangChain Support

```typescript
import { LangChainOpenAI } from "@wonderful/types/langchain";
import { LangChainAnthropic } from "@wonderful/types/langchain";
import { LangChainGoogleGenAI } from "@wonderful/types/langchain";
```

## Common Workflows

### Add a new tool

```bash
wonderful new tool --name my-tool        # Scaffold
# Implement the handler in the generated file
npx vitest                               # Test locally
wonderful deploy tools my-tool --env dev # Deploy
```

### Run a tool locally

```bash
wonderful run --account src/account.ts my-tool --params '{"key":"val"}'
wonderful run --account src/account.ts my-tool --env .env  # Load secrets/globals
wonderful run --account src/account.ts my-tool --kv key=value --secret name=value --global name=value
wonderful run --account src/account.ts my-tool --metadata '{"key":"value"}'
wonderful run --account src/account.ts my-tool --mcp-tool connection_tool
wonderful run --account src/account.ts my-tool --inspect-state  # Inspect KV/metadata after execution
```

Environment variable prefixes for `.env` files:
- `WONDERFUL_SECRET_<NAME>=<json>` - Secrets
- `WONDERFUL_GLOBAL_<NAME>=<json>` - Globals

## CLI Commands

Run `wonderful --help` for the full reference. Key commands:

```bash
# Setup & scaffolding
wonderful init                              # Initialize project
wonderful new tool|skill|agent --name <n>   # Scaffold

# Development
wonderful run --account <path> <tool-name>  # Run locally
wonderful build --account <path> --all      # Build all
wonderful chat --agent-id <id> --env <env>  # Chat with agent

# Deploy
wonderful deploy tools|skills|agents <names> --env <env>
wonderful deploy tools --all                # Deploy all

# Import from controller
wonderful import tool|skill|agent <name> --env <env>

# Auth
wonderful login                             # Login (interactive)
wonderful logout                            # Logout

# MCP servers
wonderful mcp add|remove|list|tools <name>
wonderful mcp login|logout <name>              # OAuth for MCP servers

# Secrets
wonderful secrets create --name <n> --value <json>
wonderful secrets get --name <n>               # Or --pattern <pat>

# Controller data
wonderful issues list|get|create|update|delete --env <env>
wonderful activities list|get|transcription --env <env>

# System
wonderful discover                             # Discover tools/skills in project
wonderful system update                        # Update CLI
wonderful completions <shell>                  # Shell completions (bash, zsh, fish)
```

## Testing (`@wonderful/test`)

Use Vitest with `@wonderful/test` to test tools in an isolated WASM sandbox.

### Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createToolTester } from "@wonderful/test";
import type { WrappedToolTester } from "@wonderful/test";

describe("my-tool", () => {
  let tester: WrappedToolTester;

  beforeEach(async () => {
    tester = await createToolTester({ toolPath: "./src/tools/my-tool" });
    await tester.secrets.set("API_KEY", "test-key");
  });

  afterEach(async () => {
    await tester.unmockFetch();
    await tester.resetState();
  });

  it("returns expected result", async () => {
    tester.mockFetch(() => ({ status: 200, body: { data: "value" } }));
    const result = await tester.run({ query: "test" });
    expect(result.data).toBe("value");
    expect(await tester.kv.get("some_key")).toBe("stored_value");
  });
});
```

### Key APIs

| API | Description |
|-----|-------------|
| `createToolTester({ toolPath })` | Create a tester (builds tool in WASM) |
| `tester.run(params, options?)` | Execute the tool |
| `tester.kv.get/set(key, val)` | Read/write KV state |
| `tester.secrets.set(name, value)` | Pre-load secrets |
| `tester.metadata.set(data)` | Set call metadata |
| `tester.mockFetch(handler)` | Mock all fetch calls |
| `tester.mockFetchOnce(handler)` | Mock next fetch only |
| `tester.unmockFetch()` | Clear fetch mocks |
| `tester.resetState()` | Clear all state |
| `tester.setTool(path)` | Switch tool (multi-tool flows) |
| `tester.getConsoleLogs()` | Get captured logs (needs `captureConsole: true` in options) |

Run tests: `npx vitest`

## Gotchas

- **KV is session-scoped**: Data persists only within a single call session, not across calls
- **`wonderful run` requires `--account`**: Always specify the account file path
- **`mockFetch` intercepts all fetch calls**: Including nested calls from dependencies
- **Tool names are global**: Not scoped to a skill — ensure unique names across the project
