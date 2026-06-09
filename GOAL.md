# Credit Card Company Voice AI Agent

## Assignment Overview

<aside>
💳

Build a production-quality voice AI agent for a credit card company. This is your capstone assignment - the final gate before your certification session with the CTO. Everything you learned in Week 1 comes together here.

</aside>

<aside>
🚨

**This is not a learning exercise - it is a certification-level deliverable.**

- Your agent must be production-quality: fully configured, thoroughly tested, and ready to demo as if it were being delivered to a real Wonderful client
- You cannot skip any requirement - partial completion is not acceptable. Every section below must be delivered
- You must understand and be able to explain every decision you made - the CTO will ask
- Test your agent manually by calling it yourself - it must sound human-like and natural, not just pass evals
- Mock data must be hosted in the platform's Resources section with proper API functions - not hardcoded in tools
- Your external platform must be deployed to the Apps tab in the platform
</aside>

---

## The Scenario

**Role:** A professional, secure, and empathetic credit card company customer service representative.

**Primary Goals:**

- Assist cardholders with account inquiries and common servicing tasks
- Provide secure authentication and fraud protection
- Deliver efficient, compliant customer service
- Escalate appropriately when necessary

**Tone:** Professional yet approachable. Security-conscious without being robotic. Empathetic when handling sensitive issues (fraud, disputes). Clear and concise in financial communications.

---

## What You Must Build

<aside>
⚠️

**Every subsection below is required.** Read each one carefully. If something is listed here, you must deliver it and be prepared to explain it during your certification session.

</aside>

### A. Architecture & Design

- Create a visual architecture diagram ([Draw.io](http://Draw.io) recommended) **before writing any code**
- Diagram must show: agent structure, skill boundaries, conversation flows (happy + error paths), tool interactions, data dependencies, state management, and channel-specific behaviors
- Present your diagram and design decisions to your lead before proceeding to implementation
- You will present this diagram again during certification - make it thorough

### B. Skills

Build a **multi-skill agent** with intelligent routing between capabilities. The number of skills and their exact boundaries are your design decision, but you must cover these areas:

**Required coverage:**

1. **Account Servicing** - balance inquiries, transaction lookups, payment due dates, credit limit info, statement requests, contact updates
2. **Fraud & Disputes** - reporting lost/stolen cards, suspicious transactions, card blocks/unblocks, dispute filing, fraud alerts
3. **Knowledge & Information** - general inquiries that don't require account access (card benefits, fee structures, policies, credit card education). **Must use RAG** - see section E
4. **One advanced skill of your choice** - demonstrate creativity and complex logic (examples: rewards & redemption, spend analytics, credit building assistant, or your own idea)

**Skill routing requirements:**

- Clear skill boundaries and ownership - no overlapping responsibilities
- Routing logic that correctly selects skills based on user intent
- Handle intent changes mid-conversation
- Fallback behavior when intent is unclear
- Document 3+ test scenarios for correct routing and 2+ for fallback/recovery

### C. Tools

- Build **at least 2 tools**, with at least one being a **programmable flow-based tool**
- The flow-based tool must include: input/output schemas, at least one decision branch, state persistence across nodes, and error handling
- Complete the full **CLI development lifecycle**: initialize, create, build, run locally, deploy, verify in UI
- Document your CLI workflow steps and any differences between local and deployed behavior

### D. Mock Data & Resources

<aside>
🚨

**Data must NOT be hardcoded in your tools.** This is a hard requirement.

</aside>

- Create your own **database tables in the platform's Resources section** with realistic mock data
- Build **API functions** that retrieve data from those tables - your tools must call these functions, not contain static data
- Required data domains: customer accounts (numbers, balances, limits, payment info), transactions (date, merchant, amount, category, status), card products (types, benefits, fees, APRs), and any data needed for your advanced skill
- Include edge cases in your data: negative balances, fraud flags, expired cards, etc.

<aside>
⚠️

Do NOT use real customer data. All data must be mock/generated.

</aside>

### E. RAG / Knowledge Base

- Implement a RAG tool connected to a knowledge base for your Knowledge & Information skill
- Knowledge base must cover: card benefits, rewards programs, fee structures, interest rates, application processes, general credit card education, company policies
- Use publicly available information or generate realistic mock content for company-specific policies

### F. Voice & Audio

- **TTS:** Primary provider configured + fallback provider
- **STT:** Primary provider configured + fallback provider
- **Diacritics:** At least 3 domain-specific terms with pronunciation improvements (brand names, product names, financial terminology)
- **EOT:** Validated across short utterances, long explanations, mid-sentence pauses, and interrupted speech - turn-taking must feel natural
- **Skip Turn:** At least one scenario where the agent intentionally skips a turn (silence, background noise, "hold on", etc.)

### G. Channels

- **Voice channel (required):** Fully configured with STT + TTS + EOT. Must complete a successful test call
- **SMS channel (required):** At least one notification scenario working (e.g., card lock confirmation, transaction alert, payment reminder)
- **Additional channels (optional):** Chat, email, or WhatsApp

### H. External Platform & Apps Deployment

When a customer requests a card-block removal, the agent must NOT process it automatically. Instead, it sends the case to an **external review platform you build yourself**.

**Your platform must:**

1. **Receive inquiries via API** - the agent sends a POST with case details (customer ID, card last 4, block reason, customer's stated reason, timestamp)
2. **Store and present cases** - a UI/dashboard listing pending inquiries with all relevant details
3. **Allow human decisions** - a reviewer can approve or deny, with optional notes
4. **Expose decisions via API** - the agent can query the decision status

<aside>
🚨

**Deployment requirements:**

- You must **deploy your app to the Apps tab** in the Wonderful platform
- Create needed tables in the **Resources** in the Wonderful platform
- Your agent must successfully send real API calls to your app.
    - Use both API functions made for your table and also the SDK’s table functions.
</aside>

You choose the tech stack, architecture, and deployment approach. Part of the evaluation is your ability to make and justify these decisions. Document your architecture choices and trade-offs.

### I. Guardrails & Edge Cases

- **Anti-jailbreak:** Handle prompt injection attempts and social engineering
- **Scope control:** Define supported languages, decline out-of-scope requests gracefully, handle unsupported languages
- **Offensive content:** Professional de-escalation, clear boundaries while maintaining service quality
- **Human handoff:** Clear escalation logic for: user requests human, agent can't complete task, security concerns, repeated failures/frustration
- **Graceful termination:** Goodbye message before hanging up, offer alternatives (callback, email, SMS) before ending
- **Conversation timeout:** Warnings before termination, offer to resume later

### J. Prompts

- **Agent-level prompt:** Persona, tone, security constraints, escalation criteria, language/scope limitations - following the 7-section template from Ch 3
- **Skill-level prompts:** Each skill with its own behavior rules, tool usage guidelines, error handling, and handoff conditions

### K. Testing

<aside>
🚨

**Both automated evals AND manual testing are required.** Passing evals alone is not enough.

</aside>

**Evals:**

- At least 2 success scenarios (happy paths)
- At least 2 failure scenarios (error handling)
- Define scoring criteria: accuracy, compliance, completion, user experience
- Set pass/fail thresholds and document remediation for failing scenarios

**Manual testing:**

- Call your agent yourself and have real conversations
- Verify it sounds natural, human-like, and production-ready
- Test happy paths, edge cases, and unexpected inputs
- The agent must feel like something Wonderful would deliver to a real client - not a demo prototype

### L. Metrics, Tags & Summaries

**Metrics** - track at least 3 across different categories:

- Quality (at least 1): task completion rate, first contact resolution, auth success rate, skill selection accuracy
- Operational (at least 1): average handle time, response latency, turn-taking latency
- Cost/Usage (at least 1): tool call frequency, token usage, provider costs, API call counts
- For each metric: define what "good" looks like, what triggers concern, and how you'd use the data to improve

**Tags** - design a tagging taxonomy:

- Intent tags (account_inquiry, fraud_report, payment_assistance, etc.)
- Outcome tags (resolved, escalated, abandoned, error)
- Channel tags (voice, sms, chat)
- Define rules for when/how tags are applied and verify with sample interactions

**Post-interaction summaries** - structured format including:

- Interaction type, channel, duration
- User intent(s) and actions taken
- Tools invoked and outcome/resolution
- Follow-up required and applied tags

---

## Production Quality Standard

<aside>
🎯

**Your agent must be indistinguishable from one Wonderful would deliver to a paying client.**

</aside>

This means:

- **Fully configured** - every setting is intentional, not left as default. You can explain why you chose each STT/TTS provider, each voice, each EOT threshold
- **Thoroughly tested** - not just evals, but real manual testing. You've called your agent, had real conversations, found issues, and fixed them
- **Natural on voice** - the agent sounds like a real customer service representative, not a bot reading a script
- **Complete coverage** - no gaps. Authentication works. Fraud flows work. RAG returns relevant results. Tools handle errors. Guardrails hold
- **Data-driven** - your mock data is realistic, hosted properly in Resources, and retrieved via API functions - not hardcoded
- **Deployed end-to-end** - external platform running, deployed to Apps tab, agent making real API calls

**You will be asked about everything.** If you can't explain why you made a choice, it's not ready.

---

## Certification Session

<aside>
💡

Your certification is a **1-hour session with your CTO**. Schedule it proactively once your capstone is complete.

</aside>

<aside>
⚠️

**Treat this as a customer demo.** Beyond technical knowledge, we're evaluating your ability to present the platform and your agent clearly and confidently - the way you would in front of a client.

</aside>

### Part 1: Presentation (~30 min)

- Architecture and design decisions - how you structured the agent, skill boundaries, routing logic
- Implementation choices - which tools you built, configurations, and why
- Configuration decisions - STT/TTS, voice selection, LLM provider, orchestrator type, and what alternatives you considered
- Trade-offs - what you'd do differently, what compromises you made and why

### Part 2: Live Demo & Stress Test (~20 min)

- Call the agent live and walk through different scenarios
- Happy path, edge cases, unexpected inputs
- Show the external platform: trigger a block removal, show the dashboard, approve/deny
- Expect the CTO to try to break the agent

### Part 3: Questions (~10 min)

- Probing questions throughout the entire session to verify you genuinely understand the platform and every choice you made

---

## Deliverables Checklist

### Design & Architecture

- [ ]  Architecture diagram created and approved by lead
- [ ]  Skill boundaries and routing logic documented
- [ ]  Data model and mock data structure defined

### Implementation

- [ ]  Agent created with all settings configured
- [ ]  All skills built and deployed via CLI
- [ ]  All tools built, tested locally, and deployed (at least 1 flow-based)
- [ ]  Multi-skill routing working and verified
- [ ]  Agent-level and skill-level prompts configured (7-section template)
- [ ]  At least one documented prompt iteration with improvement

### Data & RAG

- [ ]  Mock data tables created in platform Resources
- [ ]  API functions built to retrieve data from Resources (no hardcoded data)
- [ ]  RAG knowledge base set up and returning relevant results

### Voice & Channels

- [ ]  TTS configured (primary + fallback)
- [ ]  STT configured (primary + fallback)
- [ ]  Diacritics configured for 3+ terms
- [ ]  EOT behavior validated across multiple scenarios
- [ ]  Skip Turn implemented and working
- [ ]  Voice channel test call completed successfully
- [ ]  SMS channel configured with at least 1 working notification

### External Platform

- [ ]  External review platform built and deployed (not [localhost](http://localhost))
- [ ]  App deployed to the platform Apps tab
- [ ]  Agent sends real API calls to the platform
- [ ]  Dashboard displays cases clearly for reviewer decision
- [ ]  Architecture decisions documented

### Quality & Operations

- [ ]  Evals created and run (2+ success, 2+ failure scenarios)
- [ ]  Manual testing completed - agent sounds natural and production-ready
- [ ]  Guardrails tested (jailbreak, scope, offensive content)
- [ ]  Handoff and termination logic implemented with triggers documented
- [ ]  Metrics defined with targets and concern thresholds (3+ across categories)
- [ ]  Tagging taxonomy implemented and verified
- [ ]  Post-interaction summaries generating correctly

### Certification Prep

- [ ]  Dry run completed with OG Buddy
- [ ]  Demo environment ready (test phone number, screen sharing)
- [ ]  Can explain and defend every design and configuration decision