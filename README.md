# Bot Discord

Un bot Discord creato con discord.js v14 che fornisce vari comandi di utilità per la gestione del server.

## ⚠️ IMPORTANTE: Interfaccia Aggiornata

**L'interfaccia del Discord Developer Portal è cambiata!** Se vedi direttamente sezioni come "Token", "Bot Permissions", "Information Flow" dopo aver creato l'applicazione, significa che il bot è già stato creato automaticamente. Non devi cercare "Build-A-Bot" o "Add Bot" - procedi pure copiando il token!

- **/ticketsetup**: Crea un pannello ticket con pulsante cliccabile
- **/ticket**: Crea un canale di supporto privato visibile solo all'utente e allo staff
- **/renamevoc**: Rinomina tutti i canali vocali aggiungendo un prefisso emoji
- **/regole**: Invia le regole del server in un embed
- **/say**: Fa sì che il bot invii un messaggio personalizzato

## Istruzioni di Configurazione - Guida Passo per Passo Dettagliata

### 1. Prerequisiti

Prima di iniziare, assicurati di avere tutto il necessario:

- **Node.js versione 16.9.0 o superiore**: Puoi scaricarlo da https://nodejs.org/
  - Per verificare se è installato: apri il terminale e digita `node --version`
  - Se non è installato, scarica l'installer LTS dal sito ufficiale
- **Un account Discord**: Devi avere un account Discord attivo
- **Un server Discord (guild)** dove hai i permessi di amministratore
  - Se non hai un server, puoi crearne uno cliccando sul "+" verde a sinistra nella lista dei server

### 2. Creare un'Applicazione Discord

Questa è la parte più importante - creare il bot su Discord.

1. **Vai al Discord Developer Portal**:
   - Apri il browser e vai su https://discord.com/developers/applications
   - Accedi con il tuo account Discord se non sei già loggato

2. **Crea una nuova applicazione**:
   - Nella pagina principale, clicca sul pulsante blu "New Application" in alto a destra
   - Dai un nome al tuo bot (ad esempio "Mio Bot Discord")
   - Leggi e accetta i termini se richiesto
   - Clicca "Create" per creare l'applicazione

3. **Configura il Bot (sezione Bot)**:
   - **Se vedi direttamente sezioni come "Token", "Bot Permissions", "Information Flow"**: Perfetto! Significa che il bot è già stato creato automaticamente con l'applicazione
   - **Copia il Token**:
     - Nella sezione "Token", clicca sul pulsante "Copy" per copiare il token del bot
     - **IMPORTANTE**: Salva questo token - è la chiave per far funzionare il bot!
   - **Sezione "Bot Permissions" (Permessi Bot)**:
     - Qui puoi vedere i permessi base del bot
     - Per ora lascia tutto come è - configureremo i permessi specifici quando invitiamo il bot
   - **Sezione "Information Flow" (Flusso di Ingegneria/Informazioni)**:
     - Questa sezione mostra come il bot gestisce i dati
     - Non devi modificarla per il nostro bot

4. **Se il bot non è ancora configurato**:
   - In rari casi, potrebbe essere necessario aggiungere esplicitamente un bot
   - Cerca un pulsante "Add Bot" o "Create Bot" nella pagina
   - Se non lo trovi, probabilmente il bot è già creato automaticamente con l'app

### 4. Invitare il Bot al Tuo Server

Ora dobbiamo invitare il bot al tuo server Discord.

1. **Torna al Developer Portal**:
   - Sempre nella stessa pagina dell'applicazione, clicca su "OAuth2" nella barra laterale
   - Poi clicca su "URL Generator" (sub-menu)

2. **Seleziona gli scopes (ambiti)**:
   - Nella sezione "Scopes", seleziona:
     - `bot` (obbligatorio per far funzionare il bot)
     - `applications.commands` (per i comandi slash)

3. **Seleziona i permessi del bot**:
   - Nella sezione "Bot Permissions", seleziona questi permessi specifici:
     - Send Messages (Inviare messaggi)
     - Use Slash Commands (Usare comandi slash)
     - Manage Channels (Gestire canali)
     - View Channels (Visualizzare canali)
     - Read Message History (Leggere cronologia messaggi)
   - Questi permessi sono necessari perché il bot deve creare canali e inviare messaggi.

4. **Genera e usa l'URL di invito**:
   - L'URL si aggiornerà automaticamente in basso
   - Copia l'URL generato
   - Incollalo in una nuova scheda del browser
   - Seleziona il tuo server dall'elenco
   - Clicca "Authorize" (Autorizza)
   - Completa il captcha se richiesto
   - Il bot dovrebbe ora apparire nel tuo server come offline

### 5. Ottenere gli ID del Server e del Ruolo

Il bot ha bisogno di conoscere gli ID specifici del tuo server e del ruolo staff.

1. **Abilita la Modalità Sviluppatore in Discord**:
   - Apri Discord nel browser o nell'app desktop
   - Vai nelle Impostazioni Utente (clicca sull'ingranaggio accanto al tuo nome)
   - Nella sezione "App Settings", clicca su "Advanced"
   - Attiva l'interruttore "Developer Mode"

2. **Ottieni l'ID del server (Guild ID)**:
   - Nella lista dei server a sinistra, fai clic destro sul nome del tuo server
   - Nel menu contestuale, clicca su "Copy ID"
   - Questo è il tuo GUILD_ID - salvalo da qualche parte

3. **Ottieni l'ID del ruolo staff**:
   - Sempre nel tuo server, vai nelle impostazioni del server (clicca sul nome del server > Server Settings)
   - Nella barra laterale, clicca su "Roles"
   - Trova il ruolo che vuoi usare per lo staff (ad esempio "Staff" o "Moderatori")
   - Fai clic destro sul ruolo
   - Nel menu contestuale, clicca su "Copy ID"
   - Questo è il tuo STAFF_ROLE_ID

### 6. Configurare il Bot

Ora dobbiamo configurare il bot con le informazioni che abbiamo raccolto.

1. **Prepara il file di configurazione**:
   - Nella cartella del progetto (dove si trova questo README), dovresti vedere un file chiamato `.env.example`
   - Fai una copia di questo file e rinominalo in `.env`
   - Se non vedi il file `.env.example`, creane uno nuovo chiamato `.env`

2. **Compila il file .env**:
   - Apri il file `.env` con un editor di testo (come Blocco Note, VS Code, ecc.)
   - Riempi i valori con quelli che hai copiato prima:
     ```
     DISCORD_TOKEN=qui_incolla_il_token_del_bot
     GUILD_ID=qui_incolla_l_id_del_server
     STAFF_ROLE_IDS=qui_incolla_gli_id_dei_ruoli_staff
     ```
   - **Per più ruoli staff**: separa gli ID con delle virgole, ad esempio:
     ```
     STAFF_ROLE_IDS=123456789012345678,987654321098765432,111111111111111111
     ```
   - **IMPORTANTE**: Non lasciare spazi intorno al segno "=" e non aggiungere virgolette
   - Salva il file

### 7. Installare le Dipendenze

Il progetto ha bisogno di alcune librerie per funzionare.

1. **Apri il terminale**:
   - Su Windows: cerca "cmd" o "PowerShell" nel menu Start
   - Su Mac: apri "Terminal" dalle applicazioni
   - Su Linux: apri il terminale dal menu delle applicazioni

2. **Naviga alla cartella del progetto**:
   - Digita `cd` seguito dal percorso della cartella del bot
   - Ad esempio: `cd C:\Users\pietr\Downloads\bot` (su Windows)
   - Oppure: `cd /Users/pietr/Downloads/bot` (su Mac/Linux)

3. **Installa le dipendenze**:
   - Digita il comando: `npm install`
   - Premi Invio
   - Aspetta che finisca l'installazione (potrebbe richiedere qualche minuto)
   - Dovresti vedere messaggi che dicono che i pacchetti sono stati installati

### 8. Avviare il Bot

Finalmente possiamo avviare il bot! Hai **due opzioni**:

#### **Opzione A: Hosting Gratuito Online (Raccomandato per 24/7)**
Per far funzionare il bot anche quando il PC è spento, usa un servizio di hosting gratuito:

1. **Railway** (Raccomandato - Moderno e facile):
   - Vai su https://railway.app
   - Registrati con GitHub
   - Crea un nuovo progetto
   - Connetti il tuo repository Git o carica i file
   - Railway rileverà automaticamente il progetto Node.js
   - Aggiungi le variabili d'ambiente nel tab "Variables"
   - Clicca "Deploy"

2. **Render** (Alternativa gratuita):
   - Vai su https://render.com
   - Registrati e crea un "Web Service"
   - Connetti il tuo repository Git
   - Imposta il comando di build: `npm install`
   - Imposta il comando di start: `npm start`
   - Aggiungi le environment variables

3. **Replit** (Per test veloci):
   - Vai su https://replit.com
   - Crea un nuovo repl con Node.js
   - Carica i tuoi file
   - Aggiungi il file `.env` con le tue variabili
   - Clicca "Run" per avviare

#### **Opzione B: Sul Tuo PC con PM2 (Per quando il PC è acceso)**
Se vuoi tenere il bot sul tuo PC ma farlo riavviare automaticamente:

1. **Installa PM2** (già fatto): `npm install -g pm2`

2. **Avvia il bot con PM2**:
   ```bash
   npm run pm2:start
   ```

3. **Comandi utili**:
   - `npm run pm2:logs` - Vedere i log del bot
   - `npm run pm2:stop` - Fermare il bot
   - `npm run pm2:restart` - Riavviare il bot
   - `npm run pm2:monit` - Monitorare il bot

4. **Avvio automatico** (opzionale):
   - PM2 può riavviarsi automaticamente se il processo si chiude
   - Il bot si riavvia anche se fai logout dal PC

#### **Avvio Manuale (Solo per test)**
```bash
npm start
```

### ⚠️ **IMPORTANTE per Hosting Online:**
Quando carichi il codice online, **non** includere il file `.env` nel repository! Aggiungi le variabili direttamente nelle impostazioni del servizio di hosting.

### 6. Configurare il Bot
2. In qualsiasi canale di testo dove il bot ha i permessi
3. Digita `/` per vedere i comandi slash disponibili
4. Dovresti vedere i comandi: ticketsetup, ticket, renamevoc, regole, say
5. **Testa il sistema ticket privato**:
   - Usa `/ticketsetup` per creare il pannello con pulsante
   - Clicca sul pulsante "Crea Ticket" come utente normale
   - Verifica che venga creato un canale privato visibile solo agli staff
   - Gli utenti normali non dovrebbero vedere il canale creato
6. Prova anche `/regole` - il bot dovrebbe rispondere con un embed delle regole

**IMPORTANTE**: Per il comando `/ticket` e il sistema con pulsanti funzionare correttamente, devi configurare gli `STAFF_ROLE_IDS` nel file `.env`!

## Come Funziona il Sistema Ticket (come Ticket King/Ticket Tool)

Il bot ora supporta **due modi** per creare ticket con **modal interattivi**:

### 🎯 **Sistema Moderno (Privato per Staff)**
1. **Amministratore usa**: `/ticketsetup`
2. **Il bot invia**: Un embed con pulsante "Crea Ticket" e titolo "🎫 Support"
3. **Utente clicca**: Il pulsante apre un **modal** con campi per titolo e descrizione
4. **Sistema crea**: Canale privato `🎫Support-{username}` visibile **solo agli staff**
5. **Modal si chiude**: Automaticamente dopo la creazione del ticket senza messaggi di errore
6. **Staff gestisce**: I ticket sono visibili solo ai ruoli staff configurati

### ⚡ **Sistema Classico**
1. **Utente usa**: `/ticket`
2. **Sistema crea**: Immediatamente un canale privato `🎫Support-{username}`

**Vantaggi del sistema moderno:**
- ✅ **Modal interattivi** per raccogliere informazioni dettagliate
- ✅ **Titoli personalizzati** per ogni ticket
- ✅ **Canali privati** visibili solo agli staff configurati
- ✅ **Sistema sicuro** con controllo degli accessi
- ✅ **Nessun messaggio di errore** mostrato agli utenti

## Comandi Disponibili

### /ticketsetup
- **Cosa fa**: Crea un pannello ticket con un pulsante cliccabile
- **Come funziona**: Invia un embed con un pulsante "Crea Ticket" che apre un modal per inserire titolo e descrizione
- **Utilizzo**: Basta digitare `/ticketsetup` in qualsiasi canale
- **Vantaggio**: Sistema privato con canali visibili solo agli staff
- **Nome canale**: `🎫Support-{username}`
- **Caratteristiche**: Modal per dettagli, embed informativo, canali privati per staff, modal si chiude automaticamente

### /ticket
- **Cosa fa**: Crea un canale di testo privato per i ticket di supporto
- **Come funziona**: Solo l'utente che ha creato il ticket e i membri con ruoli staff possono vedere e scrivere nel canale
- **Utilizzo**: Basta digitare `/ticket` in qualsiasi canale
- **Configurazione**: Supporta più ruoli staff - inserisci tutti gli ID dei ruoli separati da virgole in `STAFF_ROLE_IDS`
- **Nome canale**: `🎫Support-{username}`

### /renamevoc [emoji]
- **Cosa fa**: Rinomina tutti i canali vocali del server aggiungendo un emoji all'inizio
- **Come funziona**: L'emoji specificata viene aggiunta come prefisso a tutti i nomi dei canali vocali
- **Utilizzo**: `/renamevoc emoji: 🎵` (sostituisci 🎵 con l'emoji che vuoi)

### /regole
- **Cosa fa**: Invia un messaggio embed con le regole del server
- **Come funziona**: Mostra un messaggio formattato con le regole principali
- **Utilizzo**: Basta digitare `/regole`

### /say [message]
- **Cosa fa**: Fa sì che il bot invii il messaggio che specifichi
- **Come funziona**: Il bot ripete esattamente quello che scrivi
- **Utilizzo**: `/say message: Ciao a tutti!`

## Risoluzione Problemi

### Il bot non si avvia
- Verifica che il token nel file `.env` sia corretto
- Assicurati che Node.js sia installato correttamente
- Controlla che tutte le dipendenze siano installate (`npm install`)

### Non vedo "Build-A-Bot" o "Add Bot" (ma vedo Token, Bot Permissions, Information Flow)
- **Questa è la situazione normale ora!** L'interfaccia è cambiata
- Se vedi direttamente "Token", "Bot Permissions", "Information Flow" significa che il bot è già creato
- Basta copiare il token dalla sezione "Token" e procedere al passo successivo
- Non devi cercare "Add Bot" - il bot è già lì automaticamente

### I comandi non appaiono
- Aspetta qualche minuto - a volte ci vuole tempo per registrare i comandi
- Verifica che il bot abbia il permesso "Use Slash Commands"
- Controlla che il GUILD_ID nel `.env` sia corretto

### Il pulsante "Chiudi Ticket" non appare
- Il pulsante di chiusura è stato rimosso per semplicità
- I ticket possono essere gestiti manualmente dagli amministratori

### Errore "Missing Access" durante la creazione del ticket
- Il sistema è stato semplificato per evitare questi errori
- Ora crea sempre un canale pubblico senza controlli di permessi speciali
- Non vengono più mostrati messaggi di errore agli utenti

### La modale dice "è sbagliato" anche se è giusto
- Questo è normale comportamento ora - la modale si chiude automaticamente dopo la creazione del ticket
- Non è un errore, è il funzionamento corretto del sistema

### La finestra del modal non si chiude dopo aver creato il ticket
- Il sistema è stato aggiornato per chiudere automaticamente la modale
- Se vedi ancora questo problema, riavvia il bot con `npm start`

### Debug e Log
- Il bot ora mostra informazioni dettagliate sui log durante l'avvio
- Quando crei un ticket, guarda i log del terminale per messaggi di debug
- I log mostrano: configurazione caricata, creazione canale, invio messaggi, errori specifici
- Usa i log per identificare problemi specifici durante la creazione dei ticket

### Comandi PM2 (per gestione locale)
- `npm run pm2:start` - Avvia il bot con PM2
- `npm run pm2:stop` - Ferma il bot
- `npm run pm2:restart` - Riavvia il bot
- `npm run pm2:logs` - Mostra i log del bot
- `npm run pm2:monit` - Monitora il bot in tempo reale
- `npm run pm2:delete` - Rimuove il bot da PM2

## Hosting del Bot 24/7

Per far funzionare il bot continuamente senza dover tenere il PC acceso, puoi usare questi servizi gratuiti:

### 🚂 **Railway (Raccomandato)**
- **Pro**: Moderno, facile, gratuito per uso base
- **Contro**: Limite di 512MB RAM, 1GB storage
- **Come**: Carica il codice, aggiungi env vars, deploy automatico

### 🌐 **Render**
- **Pro**: 750 ore gratuite al mese, sonno dopo 15 min di inattività
- **Contro**: Si "addormenta" se non usato
- **Come**: Connetti Git repo, configura build/start commands

### 💻 **Replit**
- **Pro**: Gratuito, editor online, facile per test
- **Contro**: Limitato, può essere lento
- **Come**: Carica file, aggiungi .env, clicca Run

### 🖥️ **PM2 (Sul tuo PC)**
- **Pro**: Gratuito, controllo completo
- **Contro**: Funziona solo quando il PC è acceso
- **Come**: `npm run pm2:start` per avviare automaticamente

### ⚠️ **IMPORTANTE per Hosting:**
- **Non** caricare il file `.env` online
- Aggiungi le variabili d'ambiente direttamente nel pannello del servizio
- Monitora i log per eventuali errori

## Licenza

ISC