# Changelog

## 2026-06-18 (Gestione clienti in admin, funzionalità nascondibili, fix tipo attività, mostra password)
- `auth.js`/`admin.js`/`admin.html`: nuova sezione "Clienti registrati" nel pannello admin per cercare ed eliminare gli account cliente (role `cliente`) — le prenotazioni e recensioni già fatte restano intatte.
- `layout.js`: rimosso il fallback nascosto `|| 'restaurant'` sul tipo attività nella sidebar (mascherava eventuali problemi facendo apparire l'attività come ristorante); aggiunta la possibilità di nascondere singolarmente le voci Tavoli, Eventi e Staff.
- `impostazioni.html`/`impostazioni.js`: nuova sezione "Funzionalità visibili" nel tab Profilo — il gestore può disattivare Tavoli/Eventi/Staff se non li usa, con effetto immediato su sidebar e creazione prenotazione.
- `prenotazioni.html`/`prenotazioni.js`: il campo "Tavolo" nella modale di nuova/modifica prenotazione ora è visibile solo per le attività di tipo ristorante (e solo se non disattivato dalle nuove Impostazioni) — prima compariva per tutti i tipi di attività.
- `login.html`/`style.css`: aggiunto il pulsante mostra/nascondi su tutti i campi password (login, registrazione, conferma password).

## 2026-06-15 (Banner verifica email ancora più compatto + "Listino prezzi" senza riferimenti a "menu")
- `style.css`: ridotti ulteriormente font-size/padding dei banner "sola lettura"/"verifica email" su mobile e aggiunta classe generica `.hide-mobile`.
- `layout.js`: sul banner di verifica email, su mobile viene nascosta la seconda frase ("Controlla la posta in arrivo.") per ridurre l'altezza del banner.
- `menu.js`/`menu.html`: per le attività non-ristorante ("Listino prezzi"), il titolo della pagina, l'intestazione, il messaggio "nessuna voce" e la conferma di eliminazione non mostrano più la parola "menu" ma "listino".
- `dashboard.js`/`index.html`: l'etichetta della statistica "Voci menu/listino" diventa "Voci menu" o "Voci listino" in base al tipo di attività.
- `sito.js`/`sito.html`: sul sito pubblico, link di navigazione, titolo sezione, messaggio "non ancora disponibile" e testo del QR code mostrano "Listino prezzi"/"il listino prezzi" invece di "Menu"/"il menu" per le attività non-ristorante.

## 2026-06-15 (Banner "sola lettura"/"verifica email" più compatti su mobile)
- `style.css`: su mobile (≤640px) i banner "Stai visualizzando in sola lettura..." e "Verifica il tuo indirizzo email..." occupavano troppo spazio verticale. Ridotti font-size e padding (anche dei pulsanti interni) su schermi piccoli.

## 2026-06-15 (Tabelle responsive su mobile per tutte le sezioni + controlli su form e route)
- `style.css`: generalizzata la regola "tabella → lista di card" introdotta per `#bookingsTable` in una classe riutilizzabile `.responsive-table`, applicabile a qualsiasi tabella generata dinamicamente.
- Applicata la classe `.responsive-table` (con attributi `data-label` sulle celle) a: tavoli (prenotazioni senza tavolo), eventi (elenco eventi + iscritti/lista d'attesa), clienti (elenco clienti + storico prenotazioni), comunicazioni (storico invii), admin (richieste di registrazione in attesa). Su mobile (≤640px) tutte queste tabelle non richiedono più scroll orizzontale.
- `auth.js`: `requireAdmin()` usava ancora `location.href` per i redirect (utente non admin / non loggato), reintroducendo il "rimbalzo" al login col tasto indietro sulle pagine admin. Uniformato a `location.replace()` come già fatto per `requireAuth()`.
- `login.html`: aggiunta validazione email (formato) su login, registrazione e recupero password, validazione nome obbligatorio su registrazione e completamento profilo, e password vuota non più accettata al login.
- `impostazioni.js`: validazione formato email sui campi "Email" e "Email notifiche" del profilo attività prima del salvataggio.

## 2026-06-15 ("Tutte le prenotazioni" senza scroll orizzontale su mobile)
- `prenotazioni.js`: aggiunti attributi `data-label` a ogni cella della tabella prenotazioni (Data, Ora, Cliente, Contatti, Persone, Stato, Note, azioni).
- `style.css`: su mobile (≤640px) `#bookingsTable` non è più una tabella a 8 colonne (che richiedeva scroll orizzontale), ma una lista di "card" — ogni prenotazione è una riga con i campi impilati ed etichettati (tramite `::before` su `data-label`), tutto visibile senza scorrere lateralmente.

## 2026-06-14 (Fix radice overflow mobile: .main/.content senza min-width:0)
- `style.css`: causa reale dell'overflow su mobile: `.card table { min-width: 460px }` si propagava come dimensione minima fino a `.main` e `.content` (flex item senza `min-width:0`, il default è `min-width:auto` = min-content), rendendo l'intera pagina più larga dello schermo (~460px contro ~330px) e tagliando a destra calendario, intestazioni tabella e filtri. Aggiunto `min-width: 0` su `.main` e `.content`: ora solo le tabelle larghe scorrono internamente nella propria `.card`, il resto della pagina resta nella larghezza dello schermo.

## 2026-06-14 (Fix overflow orizzontale a livello pagina su mobile)
- `style.css`/`public.css`: aggiunto `overflow-x: hidden; max-width: 100%` su `html, body`. Su mobile, qualsiasi elemento che superi anche di poco la larghezza dello schermo (tabelle, calendario, banner) creava uno scroll orizzontale a livello di pagina che spostava tutto il contenuto (calendario, intestazioni tabella, filtri) lasciandolo tagliato a sinistra. Ora l'overflow viene contenuto e il contenuto resta sempre allineato a sinistra.

## 2026-06-14 (Fix tabelle dashboard "Prossime prenotazioni"/"Da approvare" fuori schermo su mobile)
- `style.css`: come per il calendario, le tabelle della dashboard (`#upcomingList`, `#pendingList`, 5 colonne) avevano `min-width: 460px` ereditato dalla regola generale `.card table`, costringendo a scorrere orizzontalmente su schermi piccoli. Ora `table-layout: fixed; width: 100%` con colonne a percentuale e troncamento ellissi sulla colonna "Cliente", così la tabella resta dentro lo schermo (pattern già usato per `#businessTable`).

## 2026-06-14 (Fix calendario prenotazioni fuori schermo su mobile)
- `style.css`: il calendario (`prenotazioni.html`) usava `grid-template-columns: repeat(7, 1fr)`, ma le pillole prenotazione (`white-space: nowrap`) impedivano alle colonne di restringersi sotto il loro contenuto, facendo allargare l'intera griglia oltre lo schermo (serviva scorrere orizzontalmente). Corretto con `minmax(0, 1fr)` + `min-width: 0`/`overflow: hidden` sulle celle, così le pillole troncano con ellissi invece di forzare overflow.
- `style.css`: su mobile (≤640px) l'intestazione del calendario (pulsanti "Mese prec./succ." + titolo mese) va ora a capo e usa font/padding più compatti per non sforare la larghezza dello schermo.

## 2026-06-14 (Fix icona "Anteprima sito")
- `style.css`: l'icona del pulsante "Anteprima sito" nel topbar (gestionale) non aveva una dimensione definita e veniva renderizzata alla dimensione di default del browser (~150px), rompendo il pulsante. Aggiunta regola `.btn svg { width: 16px; height: 16px; }`.

## 2026-06-14 (Fix navigazione post-login e ritocchi mobile)
- `login.html`/`auth.js`: tutti i redirect dopo login/registrazione/Google e dopo logout usano ora `location.replace()` invece di `location.href`, così la pagina di login (o la dashboard precedente) non resta nello storico del browser — premendo "indietro" dopo il login non si torna più alla pagina di login con effetto "rimbalzo".
- `style.css`: aggiunto uno spinner di caricamento durante il controllo di autenticazione (`auth-pending`), che prima mostrava una pagina completamente bianca — utile su connessioni mobili lente.
- `clienti.html`: il campo di ricerca aveva una larghezza fissa (`width:280px`) che andava in overflow su mobile, ora `width:100%; max-width:280px`.
- `index.html`: la mock-UI nella hero aveva una griglia a 3 colonne fissa (`grid-cols-3`) troppo stretta su mobile, ora `grid-cols-1 sm:grid-cols-3` con padding ridotto su schermi piccoli.
- `public.css`: titolo hero del sito pubblico ridotto sotto i 720px e `.menu-grid` forzata a 1 colonna su mobile per evitare overflow orizzontale.

## 2026-06-14 (Seconda passata da audit: update bookings/reviews, email-injection, eventi.js, SEO base)
- `firestore.rules`: validazione anche su `update` di `bookings` (campi immutabili `businessUid`/`customerUid`, stato consentito, il cliente può solo annullare la propria prenotazione) e `reviews` (il gestore può solo cambiare lo stato, non rating/commento/nome).
- `scripts/lib/email.js`/`send-emails.js`/`send-reminders.js`: aggiunta `escapeHtml()` su tutti i dati utente interpolati nei template email (rischio HTML/email injection); corretto il testo "in attesa di confermata" → "in attesa di conferma".
- `eventi.js`: applicato `escapeHtml()` ai campi inseriti da gestore/iscritti (titolo, descrizione, luogo, nome/contatti iscritti), in linea col resto dell'hardening.
- `sito.html`/`sito.js`: meta description, OG tags, preconnect font Google, `aria-label` sul burger menu, `loading="lazy"` sulle immagini del menu; nuovo `app/robots.txt`.
- `auth.js`: `countAllBookings()` usa `getCountFromServer` invece di leggere tutta la collezione `bookings` (meno letture per la dashboard admin).

## 2026-06-14 (Hardening: XSS, regole Firestore, verifica email, pipeline email via GitHub Actions+Resend)
- **XSS**: nuova funzione globale `escapeHtml()` in `db.js`, applicata a tutte le interpolazioni di dati utente (nomi, note, commenti, oggetti, descrizioni) dentro `innerHTML` in `prenotazioni.js`, `dashboard.js`, `clienti.js`, `recensioni.js`, `comunicazioni.js`, `tavoli.js`, `area.js`, `admin.js`, `sito.js`, `menu.js`.
- **Regole Firestore** (`firestore.rules`): nuove funzioni `isValidBooking()`/`isValidReview()`/`isValidBusiness()`; `bookings` (create) e `reviews` (create) ora validano i campi inviati; nuovo blocco `match /broadcasts/{broadcastId}` (prima assente, default-deny bloccava `createBroadcast`); `businesses` write separato in `create`/`update`/`delete` con protezione anti-escalation (un gestore non può auto-approvarsi cambiando `status`).
- **Verifica email**: `auth.js` invia automaticamente l'email di verifica alla registrazione (`sendEmailVerification`) e aggiunge `resendVerificationEmail()`; `layout.js` mostra un banner non bloccante per gli account email/password non verificati, con pulsante per re-invio; nuovi stili `.verify-email-banner` in `style.css`.
- **Notifiche email — nuova pipeline GitHub Actions + Resend** (sostituisce le Cloud Functions, non deployabili sul piano Spark): `functions/index.js` svuotato (vedi `functions/README.md`); nuova cartella `scripts/` (`send-emails.js`, `send-reminders.js`, `lib/firebase.js`, `lib/email.js`) che usa Firebase Admin SDK + Resend per inviare conferme prenotazione, cambi di stato, approvazioni/rifiuti gestore, comunicazioni broadcast (ogni 15 minuti, `.github/workflows/email-queue.yml`) e promemoria giornalieri (`.github/workflows/email-reminders.yml`). `createPublicBooking` scrive ora il campo `notified: false` consumato dalla pipeline. Setup richiesto: secrets GitHub `FIREBASE_SERVICE_ACCOUNT` e `RESEND_API_KEY` (vedi `scripts/README.md`).

## 2026-06-13 (Sistemazioni CSS mobile per le nuove funzionalità)
- `style.css`: `.card-header` ora va a capo (`flex-wrap`) per ospitare i nuovi pulsanti (Esporta CSV, Coupon, ecc.) senza overflow orizzontale su schermi piccoli.
- `style.css`: `.modal` ha ora `overflow-x: auto` per evitare che tabelle larghe (es. lista d'attesa eventi) sfondino la finestra modale su mobile.
- `style.css`/`public.css`: `.review-card .review-head` (recensioni) va a capo se nome cliente, stelle e badge non entrano nella riga.
- `style.css`: nelle righe `.flex.justify-between.items-center` (assegnazione tavolo, liste impostazioni/prenotazioni) le select diventano a larghezza piena e la riga va a capo su mobile (≤640px).
- `public.css`: il campo coupon nel wizard di prenotazione (`.coupon-row`) si dispone in verticale su mobile (≤720px); ridotta la dimensione del punteggio recensioni e il padding delle review-card.

## 2026-06-13 (Recensioni, lista d'attesa, coupon, tavoli, export CSV, broadcast, dashboard admin, fedeltà)
- **Recensioni**: nuova collezione Firestore `reviews`. I clienti lasciano una recensione (stelle + commento) dall'area cliente (`area.html`/`area.js`) per le prenotazioni confermate e passate; la gestione recensioni (`recensioni.html`/`recensioni.js`, nuova voce di menu) permette di approvare/rifiutare/eliminare; le recensioni approvate sono mostrate sul sito pubblico (`sito.js`, sezione "Recensioni") con valutazione media. Nuove funzioni in `auth.js`: `createReview`, `getBusinessReviews`, `getApprovedReviews`, `getCustomerReviews`, `updateReviewStatus`, `deleteReview`. Nuovo helper `starsHtml()` in `db.js` e relativi stili in `style.css`/`public.css`.
- **Lista d'attesa eventi**: ogni evento ha ora un array `waitlist`; quando un evento è pieno il sito pubblico (`sito.js`) propone "Iscriviti in lista d'attesa" invece di "Partecipa". Nella gestione eventi (`eventi.js`) la lista d'attesa è mostrata separatamente con azioni "Promuovi" (sposta l'iscritto tra i partecipanti) e "Rimuovi".
- **Promozioni/coupon**: ogni attività può definire coupon (codice, tipo percentuale/fisso, valore, validità, utilizzi massimi) dalla tab "Coupon" in `impostazioni.html`/`impostazioni.js`; i coupon attivi sono pubblicati in `businessPublic` e applicabili durante la prenotazione sul sito pubblico (`sito.js`, step di conferma) con validazione di date e utilizzi.
- **Gestione tavoli**: nuova pagina `tavoli.html`/`tavoli.js` con vista giornaliera per tavolo (assegnazione/riassegnazione prenotazioni tramite select) e lista delle prenotazioni senza tavolo assegnato. Le prenotazioni hanno ora un campo `table_id`, modificabile anche dalla modale di `prenotazioni.html`.
- **Export CSV**: nuovo helper `exportCSV()` in `db.js`; pulsante "Esporta CSV" in `prenotazioni.html` (prenotazioni filtrate) e `clienti.html` (anagrafica clienti con statistiche).
- **Comunicazioni broadcast**: nuova pagina `comunicazioni.html`/`comunicazioni.js` per inviare un messaggio via email a tutti i clienti dell'attività; scrive sulla nuova collezione top-level `broadcasts` (`createBroadcast`/`getBusinessBroadcasts` in `auth.js`), elaborata da una Cloud Function.
- **Dashboard metriche admin**: `admin.html`/`admin.js` mostrano ora attività attive/in attesa/rifiutate e totale prenotazioni piattaforma, più un grafico (Chart.js) della crescita delle registrazioni per mese. Nuove funzioni `listGestoreUsers`/`countAllBookings` in `auth.js`.
- **Programma fedeltà**: nuovo campo `loyalty_points_per_booking` configurabile dalla tab "Fedeltà" in `impostazioni.html`; l'area cliente (`area.html`/`area.js`) mostra una card "Punti fedeltà" con i punti accumulati per attività, calcolati dalle prenotazioni confermate passate.
- **Notifiche email**: nuova cartella `functions/` con Cloud Functions Firebase (stub funzionante via Resend, `RESEND_API_KEY` da configurare) per email di conferma/aggiornamento stato prenotazione, promemoria giornaliero e invio delle comunicazioni broadcast. Vedi `functions/README.md` per il setup.

## 2026-06-12 (Topbar blu + tabelle più leggibili su mobile)
- `style.css`: la topbar superiore (logo, nome attività, utente) ha ora lo stesso colore blu navy della sidebar, con testo e icone in bianco/oro per contrasto.
- `style.css`: su schermi piccoli (≤640px) le tabelle del gestionale/admin usano un font più piccolo e padding ridotto, per essere più leggibili su mobile.

## 2026-06-12 (Registrazione: cliente come scelta predefinita)
- `login.html`: rimosso il selettore "Gestisco un'attività / Sono un cliente" in evidenza — la registrazione predefinita è ora per un cliente. In basso, vicino a "Torna al login", un piccolo link "Sei un'attività?" mostra i campi attività e cambia il ruolo selezionato (e torna a "Sei un cliente?" per invertire la scelta).

## 2026-06-12 (Fase 5: gestionale legge le prenotazioni dal sito pubblico)
- `auth.js`: nuove funzioni `getBusinessBookings(businessUid)` (tutte le prenotazioni della collezione `bookings` per un'attività), `updateBooking(bookingId, payload)` (modifica generica) e `deleteBooking(bookingId)`.
- `db.js`: nuova funzione `loadAllBookings()` che unisce le prenotazioni del gestionale (`businessData.bookings`) con quelle scritte dal sito pubblico (`bookings`), con cache in memoria; `getCustomers` ora accetta un array di prenotazioni invece dell'intero oggetto `data`.
- `prenotazioni.js`: calendario e tabella mostrano anche le prenotazioni del sito pubblico (etichetta "Sito"); conferma/rifiuto, modifica ed eliminazione su queste prenotazioni scrivono direttamente sulla collezione `bookings` di Firestore.
- `dashboard.js`, `statistiche.js`, `clienti.js`: contatori, grafici ed elenco clienti ora includono anche le prenotazioni provenienti dal sito pubblico.

## 2026-06-12 (Fase 3-4: prenotazioni dal sito pubblico + "Le mie prenotazioni")
- Nuova collezione Firestore top-level `bookings`: ogni prenotazione effettuata dal sito pubblico (`sito.html?b=<slug>`) viene scritta tramite `createPublicBooking` (`auth.js`) con i campi `businessUid`, `businessName`, `businessSlug`, `customerUid` (null per visitatori non autenticati), `reference`, `customer_name`, `email`, `phone`, `party_size`, `date`, `time`, `service_id`, `service_name`, `notes`, `status`, `created_at`.
- `sito.js`: la sezione "Prenota" è ora attiva anche in modalità pubblica (prima era nascosta); il calcolo degli orari disponibili (`getAvailableSlots`/`renderSlots`, ora asincroni) considera sia le prenotazioni del gestionale sia quelle live su `bookings` (`getBusinessBookingsForDate`). `generateBookingReference` non dipende più da `created_at` locale (usa un suffisso numerico casuale).
- La sezione "Le mie prenotazioni" del sito pubblico (`#cerca`, basata sui dati privati `businessData`) è nascosta in modalità pubblica: gli utenti registrati trovano le proprie prenotazioni nell'area cliente.
- `area.html`/`area.js`: nuova sezione "Le mie prenotazioni" che mostra le prenotazioni del cliente autenticato (`getCustomerBookings`), con stato (`badge-pending`/`badge-confirmed`/`badge-rejected`/`badge-cancelled`) e possibilità di annullare (`updateBookingStatus`).
- `auth.js`: nuove funzioni `createPublicBooking`, `getCustomerBookings`, `getBusinessBookingsForDate`, `updateBookingStatus`, `whoAmI`; fix nell'ordine di spread di `getCustomerBookings` che faceva sovrascrivere l'id del documento Firestore con il campo `id` interno della prenotazione.
- Nota: le pagine gestionale (`prenotazioni.html`, statistiche, ecc.) leggono ancora solo `businessData.bookings` e non vedono per ora le prenotazioni scritte dal sito pubblico nella collezione `bookings` — integrazione prevista in una fase successiva.
- Nota: i visitatori non autenticati che prenotano dal sito pubblico non hanno `customerUid` e quindi non vedranno la prenotazione in "Le mie prenotazioni"; conservano solo il codice `RZ-...` mostrato in conferma.

## 2026-06-12 (Fase 1-2: sito pubblico per-attività)
- Nuovo documento Firestore `businessPublic/{uid}`: sottoinsieme pubblico dei dati (profilo, orari, chiusure, menu, servizi, tavoli, eventi senza dati personali, prenotazioni minimali per il calcolo disponibilità), sincronizzato automaticamente da `db.js` (`saveData`/`resetDemoData`/`clearAllData`) e seminato alla registrazione di un nuovo gestore.
- `auth.js`: nuove funzioni `getBusinessBySlug(slug)`, `getPublicBusinessData(uid)`, `savePublicBusinessData(uid, data)`.
- `sito.html`/`sito.js`: ora supporta una vera modalità pubblica via `sito.html?b=<slug>` — risolve l'attività dallo slug e carica `businessPublic/{uid}` senza richiedere login. Il link "Anteprima sito" nel gestionale (`layout.js`) include automaticamente lo slug dell'attività.
- In modalità pubblica le sezioni "Prenota" e "Le mie prenotazioni" (e l'iscrizione agli eventi) sono temporaneamente nascoste: la scrittura di prenotazioni da parte di visitatori esterni è prevista nella Fase 3.
- Fix: `sito.js` chiamava `loadData()` (asincrona) in modo sincrono, lasciando `data` come Promise — ora `await`-ato correttamente.

## 2026-06-12
- Nuovo ruolo `admin`: aggiunta `admin.html` (pannello amministrazione, accessibile solo a chi ha `role: 'admin'` su `users/{uid}`).
- Flusso di approvazione registrazioni: i nuovi account gestore vengono creati con `status: 'pending'` (su `users/{uid}` e `businesses/{uid}`) e reindirizzati a `pending.html` in attesa di approvazione, senza accesso al gestionale.
- `admin.html`: elenco delle richieste di registrazione in attesa con azioni "Approva"/"Rifiuta" (`approveAccount`/`rejectAccount` in `auth.js`), ed elenco di tutte le attività registrate con relativo stato.
- `area.js`: la ricerca attività mostra solo le attività con stato attivo (le richieste in attesa/rifiutate non compaiono nella directory pubblica).
- `auth.js`: nuova funzione `homeForProfile` che centralizza il reindirizzamento post-login in base a ruolo/stato (`admin` → `admin.html`, `cliente` → `area.html`, gestore in attesa/rifiutato → `pending.html`, gestore attivo → gestionale); `requireAuth`/nuova `requireAdmin` applicano questa logica anche agli accessi diretti via URL.

## 2026-06-11
- Migrazione dati gestionale a Firestore per-account (`businessData/{uid}`): ogni account gestore ha ora i propri dati operativi (profilo, menu, prenotazioni, eventi, ecc.) invece di un'unica copia condivisa in localStorage. `db.js` sincronizza `loadData`/`saveData`/`resetDemoData`/`clearAllData` con Firestore (cache in memoria + scrittura in background); sidebar e topbar mostrano logo, nome app e nome utente per tutti gli utenti.
- Aggiunta registrazione account (`login.html`): nuova opzione "Registrati" con scelta del ruolo (gestore di un'attività o cliente).
- Per i gestori: la registrazione crea il profilo attività e lo aggiunge alla directory pubblica (`businesses/{uid}` su Firestore).
- Nuova area cliente (`area.html`): ricerca/elenco delle attività registrate su Reservo e sezione "Le mie prenotazioni" (in arrivo).
- Login e ripristino sessione ora reindirizzano in base al ruolo (gestore → gestionale, cliente → area cliente).
- `impostazioni.html`: il salvataggio del profilo attività sincronizza ora la directory pubblica su Firestore.

## Precedente
- Recupero password nel login (`login.html`) tramite link "Password dimenticata?".
- Sito pubblico (`sito.html`): wizard di prenotazione a 4 step (servizio/persone, data/orario, dati cliente, conferma con codice prenotazione `RZ-YYYYMMDD-NNNN`).
