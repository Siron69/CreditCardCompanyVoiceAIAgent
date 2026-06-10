# Architettura e Decisioni di Design — SpaceCard

Documento di accompagnamento a `architecture-diagram.drawio`. È la narrazione per la
presentazione di certificazione: cosa è stato deciso, perché, e cosa è cambiato strada facendo.

## Panoramica del sistema

```
Cliente (voce / SMS / chat)
   │
Agente SpaceCard (solo italiano, prompt a livello agente + knowledge base agganciata)
   ├── Skill: account-servicing  → get-account-info, get-transactions, update-contact
   ├── Skill: fraud-disputes     → block-card, request-card-unblock, check-unblock-status,
   │                               report-suspicious-transaction
   ├── Skill: rewards-redemption → get-rewards-balance, get-rewards-catalog, redeem-rewards
   └── Tool condiviso: authenticate-customer (flow-based, stato di sessione in KV)
   │
Wonderful Resources (tabelle workspace + API functions, protette da x-api-key)
   ├── customers, transactions, card_products, rewards, rewards_catalog
   └── card_unblock_cases  ←→  CardUnblockApp (Apps tab, coda di review umana)
```

## Decisioni chiave e motivazioni

| Decisione | Scelta | Motivazione / alternative considerate |
|---|---|---|
| Confini delle skill | 3 skill + knowledge a livello agente | Il confine è la sensibilità del dato: dati account (auth), azioni di sicurezza (auth + review umana), rewards (auth, skill avanzata). Le informazioni generali non richiedono auth, quindi vivono a livello agente, non in una skill |
| Knowledge & Information | **Knowledge base a livello agente, nessuna skill/tool RAG** | Inizialmente costruita come 4ª skill con un tool `query-knowledge-base` (`ctx.tools.callRag`). Rimossa dopo aver verificato che la piattaforma ora recupera nativamente dalla KB agganciata. Un hop in meno, latenza minore, stesso grounding — la dicitura "RAG tool" nell'assignment è precedente a questa feature (confermato con l'OG Buddy) |
| Autenticazione | Ultime 4 cifre carta + codice fiscale, stato di sessione in KV, blocco a 3 tentativi | Pattern realistico per una banca italiana; il KV è per-conversazione, quindi l'autenticazione non trapela mai tra una chiamata e l'altra |
| Accesso ai dati | Tabelle Resources + API functions, header `x-api-key` da un secret di piattaforma | Requisito hard dell'assignment (niente dati hardcoded); il secret rende le functions non pubbliche |
| Flusso di sblocco | L'agente crea il caso via API function `createUnblockCase`; legge lo stato via `getUnblockCaseStatus` (per id) oppure via **SDK `ctx.tables.filter`** (caso più recente del cliente autenticato) | Copre il requisito "use both API functions and SDK table functions" con una ragione vera per ciascuno: la scrittura passa da un'unica function validata condivisa con l'app; la lettura per cliente usa l'SDK per evitare un hop HTTP in un turno vocale |
| Piattaforma esterna | **CardUnblockApp costruita con l'Apps builder della piattaforma**, deployata nell'Apps tab | Riusa la tabella esistente `card_unblock_cases` (unica fonte di verità con l'agente), colonne di audit sulla stessa riga (`reviewed_by`, `resolved_at`, `reviewer_notes`), status vincolati a `pending/approved/denied` perché l'agente li ha hardcoded |
| Lingue | Verso il cliente 100% italiano; codice e prompt in inglese | Requisito cliente vs. convenzione di manutenibilità |

## Strategia di error handling (uniforme su tutti gli 11 tool)

1. Ogni handler è avvolto in try/catch; gli errori non gestiti inviano un `sendSystemMessage`
   che attiva il comportamento di escalation umana e restituiscono scuse garbate — il cliente
   non sente mai un errore grezzo.
2. Le letture KV sono sempre protette con `ctx.kv.exists()` — il `kv.get` della piattaforma
   **lancia un'eccezione** sulle chiavi mancanti (scoperto con un fallimento reale: un cliente
   che chiedeva l'esito dello sblocco in una nuova conversazione faceva crashare
   `check-unblock-status`; corretto su tutti i tool).
3. L'invio SMS è non-bloccante: numero validato con `/^\+\d{7,15}$/`, fallimenti ignorati
   perché l'operazione principale è già riuscita.
4. Gli errori HTTP dalle API functions restituiscono messaggi specifici e ritentabili,
   distinti dagli errori inattesi.

## Ciclo di vita di sviluppo CLI (assignment sezione C)

```bash
wonderful init                                      # una volta, setup del progetto
wonderful new tool / new skill                      # scaffold
wonderful build --account src/account.ts --all      # compila 11 tool → dist/
wonderful run --account src/account.ts <tool>       # esecuzione locale
wonderful secrets create --env dev --name WONDERFUL_SECRET_API_KEY ...
wonderful deploy tools  --account src/account.ts --env dev --all --yes
wonderful deploy skills --account src/account.ts --env dev --all
wonderful deploy agents --account src/account.ts --env dev --all
```

**Differenze osservate tra locale e deployato:**
- Globals/secrets/KV/tables stanno lato piattaforma: le esecuzioni locali richiedono stub,
  quelle deployate colpiscono i servizi reali.
- Il collegamento agente ↔ skill avviene nel tenant: il primo deploy dell'agente è fallito con
  `Cannot sync agent skills: missing in tenant` finché le skill non sono state agganciate una
  volta dalla dashboard.
- Gli endpoint delle API functions sono gli slug lowercase dei nomi delle functions creati in GUI.

## Iterazioni di prompt documentate (l'assignment ne richiede ≥ 1)

1. **Handoff verso la knowledge (tutti i prompt).** v1: i prompt delle skill dicevano "Switch to
   knowledge-rag" per le domande informative. Dopo lo spostamento della KB a livello agente,
   quel target di routing non esisteva più e avrebbe confuso il modello. v2: "answer directly
   from the knowledge base (no authentication needed)" + le regole di grounding (cifre esatte,
   niente invenzioni, fallback a operatore) spostate nel prompt agente. Miglioramento: elimina
   una rotta morta e applica le regole di grounding a tutte le skill, non a una sola.
2. **Instruction prompt della knowledge base.** v1 (default di piattaforma): RAG bot generico,
   che avrebbe fatto domande di chiarimento e citato i nomi dei documenti. v2: risponde in
   italiano, non fa mai domande di chiarimento (risponde a una chiamata di pipeline, non a una
   persona), niente citazioni delle fonti (verrebbero lette ad alta voce), riporta sempre le
   cifre esatte e rifiuta le domande sui dati personali. Miglioramento: risposte direttamente
   utilizzabili dall'agente vocale senza leak di dettagli interni.

## Trade-off da difendere in certificazione

- **Apps builder vs Next.js fatto a mano:** l'Apps builder della piattaforma ha prodotto la UI
  di review in pochi minuti e deploya nativamente nell'Apps tab; il trade-off è meno controllo
  sullo stack. Giustificato perché l'app è una coda di review interna, non un prodotto.
- **Doppio percorso di lettura dello stato:** `check-unblock-status` ha due vie di lettura
  (function + tabella SDK). Un po' più di codice, ma ogni via esiste per una ragione (vedi
  tabella sopra) e soddisfa onestamente il requisito "use both" dell'assignment.
- **`dist/` committata su git:** comoda all'inizio; da spostare in `.gitignore` in un cleanup.
