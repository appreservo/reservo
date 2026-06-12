# Changelog

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
