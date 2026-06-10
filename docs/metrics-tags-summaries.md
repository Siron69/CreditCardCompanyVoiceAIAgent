# Metriche, Tag e Summary Post-Interazione — SpaceCard

## Metriche (4, sulle 3 categorie richieste)

| Metrica | Categoria | Cos'è "buono" | Soglia di allarme | Come usiamo il dato |
|---|---|---|---|---|
| Task completion rate | Qualità | > 85% delle conversazioni si chiude con l'intento dichiarato risolto senza handoff umano | < 70% per 3 giorni consecutivi | Scomporre per intent tag: se un intento abbassa la media, iterare il prompt di quella skill o l'error handling del tool |
| Auth success rate | Qualità | > 90% delle autenticazioni riesce entro 2 tentativi | < 80%, oppure picco di blocchi a 3 fallimenti | Tanti fallimenti → trascrizione errata del codice fiscale da parte dello STT: prima tarare diacritici/spelling mode, poi eventualmente i prompt |
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
