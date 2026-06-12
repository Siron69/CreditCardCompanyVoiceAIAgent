# Configurazione Voce e Audio — SpaceCard

Impostazioni dashboard con le motivazioni che il CTO chiederà. Tutte le scelte ottimizzano per
un italiano naturale in una chiamata di servizi finanziari: chiarezza prima dell'espressività,
bassa latenza prima della ricchezza vocale.

## TTS

| | Provider | Perché |
|---|---|---|
| Primario | **ElevenLabs** | Migliore prosodia italiana disponibile; le voci multilingual v2 gestiscono bene numeri e importi in euro, che sono la maggior parte di ciò che dice questo agente |
| Fallback | **Google Cloud TTS** (it-IT Neural2/WaveNet) | Infrastruttura diversa (nessun outage condiviso), buon italiano, economico; il calo di qualità è accettabile per un fallback |

Selezione della voce: una voce adulta, professionale e calma (non giovanile/markettara) — adatta
al tono di una banca. Testare 2–3 candidate con la frase: *"Il suo saldo attuale è di
milleduecentocinquanta euro, con scadenza il quindici luglio."* — scegliere quella che legge
importi e date nel modo più naturale.

## STT

| | Provider | Perché |
|---|---|---|
| Primario | **Deepgram** (modello più recente con supporto italiano, es. nova-2/nova-3) | Latenza più bassa della categoria — conta per la naturalezza dell'EOT; buona accuratezza italiana su cifre e nomi propri (input di autenticazione) |
| Fallback | **Google Speech-to-Text** (it-IT) | Modello italiano maturo, infrastruttura indipendente |

## Diacritici / pronuncia (richiesti 3+ — ne configuriamo 5)

| Termine | Regola di pronuncia | Perché |
|---|---|---|
| SpaceCard | "Spess-card" (lettura inglese del brand, senza spelling) | Il nome del brand deve essere consistente |
| IBAN | Lettera per lettera: I-B-A-N | I clienti si aspettano l'acronimo, non una parola |
| PIN | "pin" come parola (convenzione italiana), mai confuso con l'inglese | Termine comune nei flussi |
| CVV | Spelling: C-V-V | Letto come parola è incomprensibile |
| APR / TAEG | "T-A-E-G" in spelling; nel parlato preferire "tasso annuo" | Terminologia finanziaria: l'accuratezza è compliance |

**Lettere singole (pronuncia italiana)** — il TTS tende a leggerle all'inglese quando isolate
(es. "w" → "dabol vi"). Aggiungere ai diacritici:

| Lettera | Pronuncia |
|---|---|
| W | doppia vu |
| X | ics |
| Y | ipsilon |
| J | i lunga |
| K | kappa |
| H | acca |

Difesa in profondità: il prompt agente (sezione 2) impone già di scrivere lo spelling dei codici
con i nomi italiani delle lettere ("esse di ics a"), quindi i diacritici sulle lettere singole
servono da rete di sicurezza per i casi in cui una lettera isolata finisce comunque nel testo.

Attivare inoltre la modalità spelling/numerica per la cattura delle **ultime 4 cifre della
carta** — insieme a nome e cognome è l'input STT che determina l'auth success rate. (Nota:
l'autenticazione v1 usava il codice fiscale, 16 caratteri alfanumerici dettati a voce: era il
singolo input più a rischio dell'agente ed è il motivo per cui è stato sostituito dal nome.)

## EOT (End of Turn)

Obiettivo: turni naturali, nessun taglio. Dopo la configurazione, validare questi quattro scenari:

1. **Frase breve:** "Sì." / "No." / "Grazie." → l'agente deve rispondere subito, non aspettare
2. **Spiegazione lunga:** il cliente descrive una transazione contestata per 30+ secondi → nessuna interruzione
3. **Pausa a metà frase:** "le ultime quattro cifre sono... un attimo che prendo la carta" → l'agente NON deve prendere il turno durante la pausa
4. **Interruzione:** il cliente parla sopra l'agente → l'agente si ferma e cede il turno

Partire dalla sensibilità di default della piattaforma; se fallisce (3), allungare la soglia di
silenzio EOT; se (1) risulta lento, accorciarla. Documentare il valore finale e quale scenario
lo ha determinato.

## Skip Turn

Scenario richiesto (almeno uno): il cliente dice **"un attimo" / "aspetti" / "resti in linea"**
→ l'agente salta il proprio turno e attende in silenzio. Secondo scenario: rumore di fondo /
parlato non intelligibile → saltare invece di rispondere al rumore. Terzo scenario (il più
importante per questo agente): **dettatura incompleta di un codice** — se l'utente sta dettando
il codice fiscale e si ferma a metà, l'agente salta il turno e continua ad ascoltare invece di
interrompere (istruito nel prompt; verificato emerso nei test: alla prima dettatura l'EOT
interrompeva a metà perché non aveva indizi che stesse arrivando un codice lungo — mitigato
facendo annunciare all'agente l'attesa e il marcatore di fine "fatto" prima della dettatura).

Il supporto a livello prompt c'è già (prompt agente sezione 7: "Silence or 'hold on': wait
patiently without interrupting"). Configurare la feature Skip Turn della piattaforma in modo
coerente e testare entrambi gli scenari.

## Canale SMS

I tool inviano già SMS (conferma blocco, riferimento pratica di sblocco, apertura disputa) via
`ctx.telephony.sendSms` con validazione del numero. Passi dashboard: configurare il numero di
telefonia sull'agente, poi attivare un blocco carta in una chiamata di test e verificare che
l'SMS arrivi — quello è lo "scenario di notifica funzionante" richiesto (GOAL sezione G).

## Checklist della chiamata di test (dopo la configurazione)

- [ ] La chiamata vocale di test via browser si connette e saluta in italiano
- [ ] L'autenticazione a voce funziona (nome, cognome e ultime 4 cifre catturati correttamente ≥ 4 volte su 5)
- [ ] I 4 scenari EOT qui sopra risultano naturali
- [ ] Skip Turn su "un attimo"
- [ ] Test del fallback: se la piattaforma consente di forzare il guasto del provider, verificare che il fallback subentri
- [ ] SMS ricevuto al blocco carta
