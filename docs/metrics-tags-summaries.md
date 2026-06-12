# Metriche, Tag e Summary Post-Interazione — SpaceCard

## Metriche (4, sulle 3 categorie richieste)

| Metrica | Categoria | Cos'è "buono" | Soglia di allarme | Come usiamo il dato |
|---|---|---|---|---|
| Task completion rate | Qualità | > 85% delle conversazioni si chiude con l'intento dichiarato risolto senza handoff umano | < 70% per 3 giorni consecutivi | Scomporre per intent tag: se un intento abbassa la media, iterare il prompt di quella skill o l'error handling del tool |
| Auth success rate | Qualità | > 90% delle autenticazioni riesce entro 2 tentativi | < 80%, oppure picco di blocchi a 3 fallimenti | Tanti fallimenti → trascrizione errata di nome/cognome o delle 4 cifre da parte dello STT: prima tarare spelling mode e read-back di conferma, poi eventualmente i prompt |
| Average handle time | Operativa | < 4 minuti per conversazione vocale risolta | Media > 7 minuti, o un intento con mediana > 10 min | Tempi lunghi di solito significano risposte prolisse o retry dei tool: accorciare i prompt delle skill, ispezionare la latenza dei tool |
| Tool call frequency | Costi/Utilizzo | ~3–5 chiamate tool per conversazione risolta (baseline dopo la prima settimana) | > 2× la baseline | Un salto indica chiamate ridondanti (es. ri-autenticazione nella stessa sessione) — sistemare il riuso del KV o le regole d'uso dei tool nei prompt |

**Nota per la certificazione:** le soglie partono come stime; dopo il primo batch di chiamate di
test reali, ricalibrarle e documentare il cambiamento (dimostra gestione data-driven).

## Taxonomy dei tag

### Intent tag (applicati alla prima rilevazione dell'intento, più di uno consentito per conversazione)
`account_inquiry`, `transaction_lookup`, `payment_info`, `contact_update`,
`card_block`, `card_unblock`, `fraud_report`, `dispute_filing`,
`rewards_query`, `rewards_redemption`, `knowledge_query`

### Outcome tag (esattamente uno per conversazione, applicato alla chiusura)
- `resolved` — intento soddisfatto dall'agente da solo
- `escalated_human` — trasferito a un umano (richiesta esplicita, 3 auth fallite, frustrazione, sicurezza)
- `escalated_review` — inviato alla coda di review della CardUnblockApp (richieste di sblocco)
- `abandoned` — il cliente ha riagganciato prima della risoluzione
- `auth_failed` — conversazione terminata per blocco autenticazione
- `error` — un errore tool/sistema non gestito ha attivato il percorso di scuse

### Channel tag (esattamente uno)
`voice`, `sms`, `chat`

### Regole di applicazione
1. Gli intent tag si applicano appena una skill viene ingaggiata per quell'intento; una
   conversazione che parte con una domanda informativa e passa a un blocco carta riceve sia
   `knowledge_query` sia `card_block`.
2. `escalated_review` e `resolved` sono mutuamente esclusivi: una richiesta di sblocco andata a
   buon fine è `escalated_review` (il compito dell'agente era registrarla, non risolverla).
3. `error` vince sugli altri outcome tag se il percorso scuse/escalation è stato attivato da
   un'eccezione.

### Piano di verifica
Eseguire 5 conversazioni campione (una per outcome tag, tranne `abandoned` che si simula
chiudendo la chat) e controllare nelle activities della dashboard che i tag corrispondano a
questa tabella. Registrare qui i risultati.

## Formato del summary post-interazione

```
Tipo:         [voice call | sms | chat]
Durata:       mm:ss
Intenti:      [intent tag]
Auth:         [riuscita | fallita (n tentativi) | non richiesta]
Azioni:       breve elenco puntato di cosa è stato fatto
Tool:         [nomi dei tool invocati, con esito ok/error]
Risoluzione:  [outcome tag] + descrizione in una riga
Follow-up:    [nessuno | richiamata operatore | review in corso (case id) | SMS inviato]
Tag:          lista completa dei tag applicati
```

Configurarlo come template dei summary sull'agente (dashboard → agente → summaries) così ogni
conversazione produce un record strutturato consultabile dalla lista activities.

---

# Guida operativa: come configurare tutto sulla dashboard

> Nota: i nomi esatti delle voci di menu possono variare con le versioni della piattaforma —
> cerca le sezioni Tags / Metrics / Summaries nelle impostazioni dell'agente o del workspace.
> La CLI non supporta `wonderful new tag/metric/scenario` per i progetti account-based, quindi
> tutto si crea dalla GUI.

## Passo 1 — Tag (crearli PRIMA delle metriche, che spesso li usano come filtro)

La finestra "Create Tag" ha questi campi — come compilarli:

- **Tag Name** → il nome esatto in snake_case dalla lista sotto. NON cambiarli: 4 di questi
  sono referenziati nel codice dei tool (`attachTag`)
- **Description** → una riga umana, per chi legge la lista tag (proposte sotto)
- **Category** → usa le categorie per la taxonomy: `Intent`, `Outcome` (se il dropdown
  permette di crearle; altrimenti lascia General — la taxonomy resta leggibile dai nomi)
- **Instruction-based vs Rule-based**:
  - **Instruction-based** per i tag interpretativi: il campo Tag Instructions è il criterio
    che l'LLM usa per decidere — incolla i testi sotto (sono entro i 2000 caratteri)
  - Per i 4 tag **già attaccati dal codice** (`auth_failed`, `card_unblock`,
    `escalated_review`, `contact_update`): guarda prima cosa offre **Rule-based** — se le
    condizioni deterministiche includono qualcosa come "tool X chiamato con successo", usa
    quella. Se no, crea anche questi come Instruction-based con i testi sotto: la doppia via
    (codice + LLM) non crea problemi, il tag è comunque uno solo

L'architettura a due vie da raccontare al CTO: eventi certi → tag dal codice (zero falsi
positivi); interpretazione → tag dall'LLM con istruzioni esplicite.

### Intent — Category: Intent, Instruction-based

| Tag Name | Description | Tag Instructions (incolla nel campo) |
|---|---|---|
| `account_inquiry` | Richieste su saldo/limite/scadenze | Apply when the customer asks about their own account data: balance, available credit, credit limit, next payment due date, minimum payment, or statement. Do NOT apply for general product questions that do not require their account (use knowledge_query). |
| `transaction_lookup` | Ricerca/verifica transazioni | Apply when the customer asks to see, search or verify their own transactions or recent card movements. Do NOT apply if the transaction is being reported as fraudulent or disputed (use fraud_report / dispute_filing). |
| `payment_info` | Domande su pagamenti del proprio conto | Apply when the customer asks how or when to pay their balance, about the minimum payment, revolving/instalments, or consequences of late payment, referred to their own account. |
| `contact_update` | Aggiornamento email/telefono | Apply when the customer asks to change their email address or phone number. Note: this tag is also attached automatically by the update-contact tool on success. |
| `card_block` | Blocco carta | Apply when the customer asks to block their card or reports it lost or stolen. |
| `card_unblock` | Sblocco carta / stato pratica | Apply when the customer asks to unblock their card, submits an unblock request, or asks about the status of an existing unblock case. Note: also attached automatically by the request-card-unblock tool. |
| `fraud_report` | Segnalazione frode | Apply when the customer reports a suspicious, unrecognized or fraudulent transaction, or suspects fraud on their account. |
| `dispute_filing` | Apertura disputa | Apply when a dispute (chargeback) is opened about a transaction: wrong amount, double charge, goods not received or not as described. |
| `rewards_query` | Consultazione punti/catalogo | Apply when the customer asks about their points balance, tier, points expiry, or browses the rewards catalog WITHOUT completing a redemption. |
| `rewards_redemption` | Riscatto punti | Apply when the customer redeems (or attempts to redeem) points for a reward, going through the confirmation flow. |
| `knowledge_query` | Domanda informativa generale | Apply when the customer asks a general informational question answered from the knowledge base — fees, rates, card benefits, policies, how things work — that does NOT require access to their personal account data. |

### Outcome — Category: Outcome, Instruction-based (UNO solo per conversazione)

| Tag Name | Description | Tag Instructions (incolla nel campo) |
|---|---|---|
| `resolved` | Richiesta risolta dall'agente | Apply at the end of the conversation if the customer's request was fully handled by the AI agent with no human involvement. Do NOT apply if an unblock review case was filed (use escalated_review) or if any transfer to a human happened. |
| `escalated_human` | Trasferita a operatore | Apply when the conversation was transferred to a human agent for any reason: explicit customer request, repeated failures, security concern, or offensive behavior. |
| `escalated_review` | Caso inviato alla review | Apply when a card unblock case was submitted to the human review queue. Note: attached automatically by the request-card-unblock tool — apply only if missing. |
| `abandoned` | Cliente uscito prima della fine | Apply if the customer hung up or stopped responding before their request was resolved, including conversations closed by silence timeout. |
| `auth_failed` | Blocco per autenticazione fallita | Apply when authentication was locked after 3 failed attempts and the conversation could not proceed. Note: attached automatically by the authenticate-customer tool. |
| `error` | Errore tecnico nel flusso | Apply when a technical or tool error interrupted the normal flow and the agent had to apologize or escalate because of a system problem (not because of the customer). |

### Channel

`voice`, `sms`, `chat` — PRIMA verifica se la piattaforma traccia già il canale nativamente
nelle activities (campo channel/type della communication): in quel caso NON creare questi tag,
usa il dato nativo — meno duplicazione, e al CTO dici esattamente questo.

## Passo 2 — Metriche

Per ciascuna delle 4 metriche della tabella a inizio documento, crea una metrica sulla
dashboard. Per ognuna ti serviranno tipicamente: nome, descrizione/criterio, e come si misura.
Impostazioni consigliate:

1. **Task completion rate** (Qualità) — misurabile come % conversazioni con outcome `resolved`
   (o `escalated_review`, che per lo sblocco È il successo) sul totale. Se la piattaforma
   permette metriche LLM-valutate, criterio: "Did the agent fully accomplish what the customer
   asked, without needing a human?"
2. **Auth success rate** (Qualità) — % autenticazioni riuscite entro 2 tentativi. Criterio LLM:
   "Did the customer authenticate successfully within two attempts?" Le conversazioni col tag
   `auth_failed` contano come fallimento.
3. **Average handle time** (Operativa) — di solito nativa della piattaforma (durata
   conversazione): se esiste, configura solo le soglie; non crearne una doppia.
4. **Tool call frequency** (Costi/Utilizzo) — numero di tool call per conversazione; anche
   questa è spesso nativa nelle activities. Se non c'è, criterio LLM: "How many tool calls
   were made? Flag if more than 8."

Per OGNI metrica annota nel registro qui sotto target e soglia di allarme (sono già nella
tabella in alto) — al CTO interessa che tu sappia dire cosa faresti quando la soglia scatta.

## Passo 3 — Summary post-interazione

Nelle impostazioni dell'agente (sezione summaries/post-interaction), incolla questo template
come istruzione di generazione:

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

L'ultima riga è importante: il summary è un documento interno persistente — non deve
contenere dati sensibili completi (è anche un bel punto compliance da citare al CTO).

## Passo 4 — Verifica (richiesta da GOAL: "verify with sample interactions")

Esegui queste 5 conversazioni di test e compila il registro:

| # | Conversazione | Tag attesi | Esito atteso |
|---|---|---|---|
| 1 | Auth ok + saldo | `account_inquiry`, `resolved` | summary con Auth: riuscita |
| 2 | 3 auth fallite | `auth_failed` | summary con Auth: fallita (3) |
| 3 | Sblocco carta completo | `card_unblock`, `escalated_review` | Follow-up: review in corso |
| 4 | Aggiorna telefono | `contact_update`, `resolved` | azione con numero normalizzato |
| 5 | Domanda KB + "voglio un operatore" | `knowledge_query`, `escalated_human` | — |

| Data | Test # | Tag applicati | Summary corretto? | Note |
|---|---|---|---|---|
| | | | | |
