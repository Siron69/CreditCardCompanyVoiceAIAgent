# Scenari di Test del Routing tra Skill — SpaceCard

La sezione B di GOAL richiede 3+ scenari di routing corretto e 2+ di fallback/recovery,
documentati. Eseguire via chat o test vocale; registrare PASS/FAIL e data.

## Routing corretto

### R1 — Intento diretto → account-servicing
- Dire: "Quanto devo pagare questo mese?"
- Atteso: account-servicing ingaggiata, autenticazione richiesta, `get-account-info` chiamato.
- PASS se nessun'altra skill viene ingaggiata prima. [ ]

### R2 — Domanda informativa fuori dalle skill (KB a livello agente)
- Dire: "Che vantaggi ha la carta Platinum rispetto alla Gold?"
- Atteso: risposta dalla knowledge base, **nessuna autenticazione richiesta**, nessuna chiamata tool.
- PASS se la risposta corrisponde al contenuto della KB (lounge, zero commissioni estero, 2x punti...). [ ]

### R3 — Cambio di intento a metà conversazione
- Autenticarsi e chiedere il saldo (account-servicing), poi dire:
  "Ah, un'altra cosa: non riconosco una transazione di ieri."
- Atteso: passaggio naturale a fraud-disputes, NESSUNA ri-autenticazione (riuso del KV),
  percorso `report-suspicious-transaction` proposto.
- PASS se il passaggio avviene senza richiedere di nuovo le credenziali. [ ]

### R4 — Handoff da knowledge ad azione
- Chiedere: "Come funziona lo sblocco della carta?" (risposta KB), poi: "Ok, la mia è bloccata, procediamo."
- Atteso: prima la risposta sulla policy dalla KB, poi fraud-disputes ingaggiata con
  autenticazione e `request-card-unblock`.
- PASS se le due fasi avvengono in quest'ordine. [ ]

## Fallback / recovery

### FB1 — Intento poco chiaro
- Dire: "Ho un problema con la carta." (e nient'altro)
- Atteso: l'agente fa UNA domanda di chiarimento in italiano ("Mi può dire che tipo di
  problema?...") invece di indovinare una skill o chiamare tool alla cieca.
- PASS se nessun tool viene chiamato prima del chiarimento. [ ]

### FB2 — Fuori scope, rifiuto garbato
- Dire: "Mi consigli un buon ristorante a Milano? E che tempo fa domani?"
- Atteso: rifiuto cortese secondo la sezione 6 del prompt agente ("posso aiutarti solo con i
  servizi della tua carta SpaceCard"), la conversazione prosegue normalmente dopo.
- PASS se non c'è risposta inventata e il tono resta cordiale. [ ]

### FB3 — Recovery dopo errore di un tool (extra opzionale)
- Rompere temporaneamente una function (o usare un customer id che restituisce 404) e chiedere il saldo.
- Atteso: messaggio di scuse, un retry, poi offerta di operatore umano — mai uno stack trace o silenzio.
- PASS se si attiva il percorso graceful. [ ]

## Registro dei risultati

| Data | Scenario | Canale | Esito | Note |
|---|---|---|---|---|
| | | | | |
