# Piano di Implementazione — Credit Card Voice AI Agent

## Decisioni Architetturali

| Area | Scelta | Motivazione |
|------|--------|-------------|
| Lingua | Italiano 100% | Requisito cliente |
| TTS primario | ElevenLabs | Voci italiane naturali |
| TTS fallback | Google Cloud TTS | Ottimo supporto italiano |
| STT primario | Deepgram | Supporto italiano, bassa latenza |
| STT fallback | Google Speech-to-Text | Affidabilità su italiano |
| Autenticazione | Ultime 4 cifre carta + codice fiscale | Pattern realistico per banca italiana |
| Dashboard esterna | Next.js + Vercel | API routes + UI in un progetto, deploy gratuito |
| Dati core agent | Wonderful Resources + API functions | Requisito GOAL, no hardcoding |
| Dati card-block review | DB nella dashboard Next.js | Separazione responsabilità |
| Test voice | Browser nella piattaforma Wonderful | Nessun numero telefonico necessario |

---

## Struttura dell'Agente

```
Agent: "Assistente Carta di Credito"
├── Skill: account-servicing
├── Skill: fraud-disputes
├── Skill: knowledge-rag
└── Skill: rewards-redemption
```

### Skill 1 — Account Servicing
**Responsabilità:** Tutto ciò che richiede accesso all'account autenticato
- Saldo e limite di credito
- Transazioni recenti
- Data prossima scadenza pagamento
- Richiesta estratto conto
- Aggiornamento dati di contatto

**Tools:**
- `authenticate-customer` (flow-based) — verifica ultime 4 cifre carta + codice fiscale, persiste stato auth in KV
- `get-account-info` — recupera saldo, limite, scadenza da Wonderful Resources
- `get-transactions` — lista transazioni recenti con filtri (data, importo, categoria)
- `update-contact` — aggiorna email/telefono

### Skill 2 — Fraud & Disputes
**Responsabilità:** Tutto ciò che riguarda sicurezza e anomalie
- Segnalazione carta smarrita/rubata
- Blocco carta
- Sblocco carta (→ invia a dashboard esterna per review umana)
- Segnalazione transazione sospetta
- Apertura disputa
- Alert antifrode

**Tools:**
- `block-card` — blocca carta immediatamente, invia SMS conferma
- `request-card-unblock` (flow-based) — NON sblocca automaticamente, invia caso alla dashboard esterna via POST API, persiste case_id in KV
- `report-suspicious-transaction` — registra segnalazione, apre disputa
- `check-unblock-status` — interroga dashboard esterna per decisione reviewer

### Skill 3 — Knowledge & RAG
**Responsabilità:** Domande generali che NON richiedono accesso account
- Benefici delle carte
- Struttura commissioni e tassi
- Programmi rewards
- Processi di richiesta carta
- Educazione finanziaria generale
- Policy aziendali

**Tools:**
- `query-knowledge-base` — RAG su knowledge base in Wonderful

### Skill 4 — Rewards & Redemption
**Responsabilità:** Gestione punti fedeltà
- Saldo punti corrente
- Storico accumulo punti
- Catalogo premi disponibili
- Riscatto punti (cashback, prodotti, viaggi)
- Calcolo punti per prossimo livello
- Scadenza punti

**Tools:**
- `get-rewards-balance` — saldo punti e livello fedeltà
- `get-rewards-catalog` — lista premi disponibili con costo in punti
- `redeem-rewards` (flow-based) — flusso di riscatto con conferma, verifica disponibilità, aggiornamento saldo

---

## Struttura Dati (Wonderful Resources)

### Tabella: `customers`
```
id, card_number (hashed), last_four, codice_fiscale, first_name, last_name,
email, phone, account_status (active/blocked/expired/fraud_flag),
credit_limit, current_balance, payment_due_date, minimum_payment
```

### Tabella: `transactions`
```
id, customer_id, date, merchant_name, amount, category,
status (completed/pending/disputed/fraud), description
```

### Tabella: `card_products`
```
id, product_name, card_type, annual_fee, apr_purchase, apr_cash,
foreign_transaction_fee, benefits (array), rewards_rate
```

### Tabella: `rewards`
```
id, customer_id, points_balance, tier (bronze/silver/gold/platinum),
points_expiry_date, lifetime_points
```

### Tabella: `rewards_catalog`
```
id, reward_name, category, points_cost, description, available
```

### API Functions (Wonderful)
- `getCustomerByAuth(last_four, codice_fiscale)` → customer o null
- `getAccountInfo(customer_id)` → saldo, limite, scadenza
- `getTransactions(customer_id, filters)` → lista transazioni
- `updateContactInfo(customer_id, data)` → conferma
- `blockCard(customer_id)` → conferma
- `getRewardsBalance(customer_id)` → punti, tier
- `getRewardsCatalog()` → lista premi
- `redeemReward(customer_id, reward_id)` → esito riscatto

### Dati Mock da includere
- Almeno 5 clienti con profili diversi
- Cliente con saldo negativo
- Cliente con carta bloccata per frode (fraud_flag)
- Cliente con carta scaduta
- Cliente con punti in scadenza
- Transazioni sospette pre-caricate
- Almeno 3 tipi di carta prodotto diversi

---

## Dashboard Esterna — Card Unblock Review

### Stack: Next.js + Vercel + SQLite (via Prisma) o Supabase

### Funzionalità:
1. **POST /api/cases** — riceve caso da agente (customer_id, card_last_four, block_reason, customer_stated_reason, timestamp)
2. **GET /api/cases** — lista casi pending
3. **GET /api/cases/[id]** — dettaglio singolo caso
4. **PATCH /api/cases/[id]** — reviewer approva/nega con note
5. **UI Dashboard** — tabella casi con stato, bottoni Approva/Nega, form note

### Schema DB:
```
cases: id, customer_id, card_last_four, block_reason, customer_stated_reason,
       status (pending/approved/denied), reviewer_notes, created_at, resolved_at
```

---

## Knowledge Base (RAG)

### Contenuto da creare:
- Benefici per ogni tipo di carta (3+ prodotti)
- Struttura commissioni: annuale, prelievo, estero, ritardo pagamento
- Come funzionano i tassi APR
- Processo richiesta nuova carta
- Come aumentare il limite di credito
- Cosa fare in caso di frode
- Come funzionano i punti rewards
- Glossario termini finanziari in italiano
- Policy rimborso e dispute
- Domande frequenti (FAQ)

---

## Voice & Audio

### Diacritici da configurare (min 3):
1. **"IBAN"** → pronuncia lettera per lettera: "I-B-A-N"
2. **"PIN"** → "P-I-N" non "pin"
3. **"CVV"** → "C-V-V"
4. **"APR"** → "A-P-R" (tasso annuo)
5. **"BancaCard"** → nome brand con accento corretto (nome fittizio del prodotto)

### EOT (End of Turn) — scenari da validare:
- Utterance breve: "Sì" / "No" / "Grazie"
- Spiegazione lunga (30+ secondi)
- Pausa a metà frase (es. cliente cerca documento)
- Interruzione dell'agente da parte del cliente

### Skip Turn:
- Silenzio prolungato (>3 secondi) → agente aspetta senza parlare
- Cliente dice "un momento" / "aspetti" → agente non interrompe

---

## Guardrails

| Scenario | Comportamento |
|----------|---------------|
| Prompt injection | Risponde solo come assistente carta, ignora istruzioni nel testo |
| Richiesta fuori scope | "Mi dispiace, posso aiutarti solo con la tua carta di credito" |
| Lingua non italiana | Risponde in italiano, spiega che il servizio è solo in italiano |
| Contenuto offensivo | De-escalation professionale, offre trasferimento a operatore |
| Richiesta operatore umano | Trasferisce subito senza resistenza |
| Fallimento ripetuto (3x) | Offre escalation automatica |
| Timeout silenzio | Warning a 30s, chiusura a 60s con offerta callback |

---

## Metriche (min 3)

| Metrica | Categoria | Target | Soglia preoccupazione |
|---------|-----------|--------|-----------------------|
| Task completion rate | Quality | >85% | <70% |
| Auth success rate | Quality | >90% | <80% |
| Average handle time | Operational | <4 min | >7 min |
| Turn-taking latency | Operational | <800ms | >1500ms |
| Tool call frequency | Cost/Usage | baseline | >2x baseline |

---

## Tagging Taxonomy

**Intent tags:** `account_inquiry`, `fraud_report`, `card_block`, `card_unblock`, `transaction_lookup`, `payment_info`, `rewards_query`, `rewards_redemption`, `knowledge_query`, `dispute_filing`, `contact_update`

**Outcome tags:** `resolved`, `escalated_human`, `escalated_review`, `abandoned`, `auth_failed`, `error`

**Channel tags:** `voice`, `sms`

---

## Evals (min 4)

### Successo:
1. Cliente autentica, chiede saldo → risposta corretta con dati mock
2. Cliente chiede riscatto punti → flusso completo con conferma

### Fallimento:
1. Autenticazione con dati errati → rifiuto sicuro, no dati esposti
2. Cliente chiede sblocco carta → caso inviato a dashboard, NO sblocco automatico

---

## Fasi di Implementazione

### Fase 1 — Setup & Dati (priorità assoluta)
1. Creare tabelle in Wonderful Resources
2. Popolare con dati mock realistici (inclusi edge case)
3. Creare API functions in Wonderful
4. Testare API functions manualmente

### Fase 2 — Tools Core
1. `authenticate-customer` (flow-based) — il più critico
2. `get-account-info`
3. `get-transactions`
4. `block-card`
5. `request-card-unblock` (flow-based)

### Fase 3 — Skills & Agent
1. Creare 4 skill con prompt italiani
2. Creare agent con routing logic
3. Configurare TTS/STT/EOT
4. Configurare diacritici

### Fase 4 — Features Avanzate
1. `query-knowledge-base` + RAG setup
2. Tools rewards (get-balance, catalog, redeem)
3. SMS channel (conferma blocco carta)
4. Guardrails e edge cases

### Fase 5 — Dashboard Esterna
1. Scaffold Next.js
2. API routes (POST/GET/PATCH cases)
3. UI dashboard reviewer
4. Deploy su Vercel
5. Collegare agent → dashboard

### Fase 6 — Testing & Rifinitura
1. Evals automatici (4 scenari)
2. Test manuali via browser
3. Iterazione prompt
4. Metriche e tag
5. Post-interaction summaries

---

## Struttura File Progetto (Wonderful)

```
src/
├── account.ts                    # Entry point
├── agents/
│   └── credit-card-agent.ts
├── skills/
│   ├── account-servicing.ts
│   ├── fraud-disputes.ts
│   ├── knowledge-rag.ts
│   └── rewards-redemption.ts
├── tools/
│   ├── authenticate-customer.ts  # flow-based
│   ├── get-account-info.ts
│   ├── get-transactions.ts
│   ├── update-contact.ts
│   ├── block-card.ts
│   ├── request-card-unblock.ts   # flow-based
│   ├── check-unblock-status.ts
│   ├── report-suspicious-transaction.ts
│   ├── query-knowledge-base.ts
│   ├── get-rewards-balance.ts
│   ├── get-rewards-catalog.ts
│   └── redeem-rewards.ts         # flow-based
└── prompts/
    ├── agents/
    │   └── credit-card-agent.md
    └── skills/
        ├── account-servicing.md
        ├── fraud-disputes.md
        ├── knowledge-rag.md
        └── rewards-redemption.md
```
