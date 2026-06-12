# Prompt for the platform agent — create Tags, Metrics and Post-Interaction Summary

Copy everything below this line and give it to the platform agent.

---

Set up the observability configuration (tags, metrics, post-interaction summary) for the
**SpaceCard** agent — an Italian-speaking voice/chat customer service agent for a credit card
company. Follow these requirements exactly.

## Hard constraints (do not violate)

1. **Tag names must be EXACTLY as listed below** (snake_case, lowercase). Four of them
   (`auth_failed`, `card_unblock`, `escalated_review`, `contact_update`) are referenced by
   the agent's tool code via `ctx.metadata.attachTag()` — renaming them breaks the integration.
2. Do not invent additional tags, metrics, or summary fields beyond what is specified.
3. Outcome tags are mutually exclusive: one per conversation. This rule is encoded in their
   instructions — keep it.
4. The summary must NEVER contain a full codice fiscale or full card numbers — only the last
   4 digits. This constraint must stay in the summary instructions.

## Part 1 — Tags

For each tag below: create it with the given **Name**, **Description**, and **Category**
(create the categories `Intent` and `Outcome` if custom categories are supported; otherwise
use General).

**Tagging mode:** use **Instruction-based tagging** with the provided instructions. Exception:
for the four code-attached tags (`auth_failed`, `card_unblock`, `escalated_review`,
`contact_update`), if Rule-based tagging supports a deterministic condition equivalent to
"tool X was called successfully", prefer that; otherwise use Instruction-based with the
provided text.

### Intent tags (Category: Intent)

| Name | Description | Tag Instructions |
|---|---|---|
| account_inquiry | Questions about own balance/limit/due dates | Apply when the customer asks about their own account data: balance, available credit, credit limit, next payment due date, minimum payment, or statement. Do NOT apply for general product questions that do not require their account (use knowledge_query). |
| transaction_lookup | Searching/verifying own transactions | Apply when the customer asks to see, search or verify their own transactions or recent card movements. Do NOT apply if the transaction is being reported as fraudulent or disputed (use fraud_report / dispute_filing). |
| payment_info | Questions about paying own balance | Apply when the customer asks how or when to pay their balance, about the minimum payment, revolving/instalments, or consequences of late payment, referred to their own account. |
| contact_update | Email/phone update | Apply when the customer asks to change their email address or phone number. Note: this tag is also attached automatically by the update-contact tool on success. |
| card_block | Card block request | Apply when the customer asks to block their card or reports it lost or stolen. |
| card_unblock | Card unblock request / case status | Apply when the customer asks to unblock their card, submits an unblock request, or asks about the status of an existing unblock case. Note: also attached automatically by the request-card-unblock tool. |
| fraud_report | Fraud / suspicious transaction report | Apply when the customer reports a suspicious, unrecognized or fraudulent transaction, or suspects fraud on their account. |
| dispute_filing | Dispute / chargeback opened | Apply when a dispute (chargeback) is opened about a transaction: wrong amount, double charge, goods not received or not as described. |
| rewards_query | Points/catalog consultation | Apply when the customer asks about their points balance, tier, points expiry, or browses the rewards catalog WITHOUT completing a redemption. |
| rewards_redemption | Points redemption | Apply when the customer redeems (or attempts to redeem) points for a reward, going through the confirmation flow. |
| knowledge_query | General informational question | Apply when the customer asks a general informational question answered from the knowledge base — fees, rates, card benefits, policies, how things work — that does NOT require access to their personal account data. |

### Outcome tags (Category: Outcome — one per conversation)

| Name | Description | Tag Instructions |
|---|---|---|
| resolved | Fully handled by the AI agent | Apply at the end of the conversation if the customer's request was fully handled by the AI agent with no human involvement. Do NOT apply if an unblock review case was filed (use escalated_review) or if any transfer to a human happened. |
| escalated_human | Transferred to a human agent | Apply when the conversation was transferred to a human agent for any reason: explicit customer request, repeated failures, security concern, or offensive behavior. |
| escalated_review | Unblock case sent to human review | Apply when a card unblock case was submitted to the human review queue. Note: attached automatically by the request-card-unblock tool — apply only if missing. |
| abandoned | Customer left before resolution | Apply if the customer hung up or stopped responding before their request was resolved, including conversations closed by silence timeout. |
| auth_failed | Locked after failed authentication | Apply when authentication was locked after 3 failed attempts and the conversation could not proceed. Note: attached automatically by the authenticate-customer tool. |
| error | Technical error broke the flow | Apply when a technical or tool error interrupted the normal flow and the agent had to apologize or escalate because of a system problem (not because of the customer). |

### Channel tags — conditional

First check whether the platform already tracks the conversation channel natively
(voice / chat / sms on the communication record). **If it does, do NOT create channel tags**
and report that the native field is used. Only if there is no native channel tracking, create
three Instruction-based tags `voice`, `sms`, `chat` (Category: General) with the instruction
"Apply when the conversation happened on the <channel> channel."

## Part 2 — Metrics

Before creating anything, check which of these the platform already measures natively
(conversation duration, tool call counts). Configure native metrics where available instead
of duplicating them; create custom/LLM-evaluated metrics only for the rest.

| Metric | Category | How to measure | Target | Concern threshold |
|---|---|---|---|---|
| Task completion rate | Quality | % of conversations whose outcome is `resolved` OR `escalated_review` (for unblock requests, filing the case IS success) over total conversations. LLM criterion if needed: "Did the agent fully accomplish what the customer asked, without needing a human?" | > 85% | < 70% for 3 consecutive days |
| Auth success rate | Quality | % of authentication flows succeeding within 2 attempts. Conversations tagged `auth_failed` count as failures. LLM criterion if needed: "Did the customer authenticate successfully within two attempts?" | > 90% | < 80%, or a spike of `auth_failed` |
| Average handle time | Operational | Native conversation duration metric if available; configure thresholds only | < 4 min | > 7 min average |
| Tool call frequency | Cost/Usage | Native tool-call count per conversation if available. LLM criterion if needed: "How many tool calls were made? Flag if more than 8." | 3–5 per resolved conversation | > 2x the established baseline |

## Part 3 — Post-interaction summary

Configure the agent's post-interaction summary with these generation instructions:

```
Generate a structured post-interaction summary in Italian with EXACTLY these fields:

Tipo:         [voice call | sms | chat]
Durata:       mm:ss
Intenti:      [intent tags detected]
Auth:         [riuscita | fallita (n tentativi) | non richiesta]
Azioni:       bullet list of what was done, one line each
Tool:         [tool names invoked, each with outcome ok/error]
Risoluzione:  [outcome tag] + one-line description
Follow-up:    [nessuno | richiamata operatore | review in corso (case id) | SMS inviato]
Tag:          full list of applied tags

Be factual and concise. Use the customer's stated intent, not a paraphrase.
Never include the full codice fiscale or card numbers — only the last 4 digits.
```

The summary OUTPUT is in Italian (the agent and its operators are Italian); these
configuration instructions stay in English.

## Part 4 — Report back

When done, reply with:
1. The list of tags created (name + mode used), and which categories were created
2. Which of the four code-attached tags ended up Rule-based vs Instruction-based
3. Whether channel tags were created or the native channel field is used
4. Which metrics are native vs custom, with the configured thresholds
5. Anything you could NOT configure as specified, and why
