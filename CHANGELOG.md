# Changelog

## 2026-06-28 (5)
- `privacy.html`: nuova pagina privacy policy pubblica — carica dinamicamente nome e email dell'attività dal profilo (`?b=slug`).
- `sito.html`: aggiunta nota privacy sotto il pulsante "Conferma prenotazione" e link "Privacy policy" nel footer.
- `sito.js`: i link alla privacy vengono aggiornati con il parametro slug corrente.
- `public.css`: aggiunto stile `.privacy-note`.

## 2026-06-28 (4)
- `qr.html` / `qr.js`: nuova pagina admin dedicata al QR Code — mostra il QR che punta al sito pubblico (`sito.html?b=slug`), con pulsanti "Scarica PNG" e "Stampa".
- `layout.js`: voce "QR Code" in sidebar ora punta a `qr.html` invece di aprire `sito.html` in un nuovo tab.
- `sito.html` / `sito.js`: rimossa la sezione QR Code dal sito pubblico (navigazione e blocco `#qr`); rimosso il codice JS di generazione QR e la libreria `qrcodejs`.

## 2026-06-28 (3)
- `layout.js`: rimosso il blocco logo + scritta "Reservo" dalla sidebar; logo e nome rimangono solo nella topbar (navbar). Rimossi anche i CSS `.sidebar-brand` diventati inutilizzati.

## 2026-06-28 (2) (Nuove funzionalità: ricerca, blocchi, ricorrenti, agenda, statistiche, export)

**Prenotazioni:**
- `prenotazioni.html`/`prenotazioni.js`: ricerca testuale nella tabella prenotazioni (nome, email, telefono).
- `prenotazioni.html`/`prenotazioni.js`: autocomplete nome cliente nel form admin — se si seleziona un cliente dall'anagrafica, email/telefono/customer_id vengono precompilati automaticamente.
- `prenotazioni.html`/`prenotazioni.js`: blocchi orario manuali — checkbox "Blocca orario" nel form, crea una voce che occupa lo slot senza essere una prenotazione cliente; visibile nel calendario con indicatore ⊘ e badge "Blocco" in tabella.
- `prenotazioni.html`/`prenotazioni.js`: prenotazioni ricorrenti — checkbox "Ripeti appuntamento" permette di creare N copie dello stesso appuntamento con cadenza settimanale/bisettimanale/mensile.
- `prenotazioni.js`: auto-link — al caricamento della pagina, le prenotazioni senza `customer_id` vengono collegate automaticamente all'anagrafica se l'email corrisponde (sia prenotazioni admin che da sito pubblico via Firestore).

**Clienti:**
- `clienti.html`/`clienti.js`: export CSV completo dell'anagrafica clienti con tutti i campi (nome, cognome, email, telefono, data di nascita, CF, indirizzo, città, provincia, note).

**Dashboard:**
- `index.html`/`dashboard.js`: nuova card "Agenda di oggi" con gli appuntamenti del giorno in ordine cronologico (ora, cliente, servizio, persone, stato).

**Statistiche:**
- `statistiche.html`/`statistiche.js`: filtro per servizio — tutti i grafici e KPI si aggiornano in base al servizio selezionato.

**Eventi:**
- `eventi.js`: controllo capienza nella scheda iscritti — avviso se si supera il numero massimo di partecipanti.
- `eventi.html`/`eventi.js`: esportazione CSV degli iscritti (confermati + lista d'attesa) per ogni evento.

**Impostazioni:**
- `impostazioni.html`/`impostazioni.js`: esportazione backup completo dei dati in formato JSON scaricabile.
- `impostazioni.js`: rimosso residuo 'coupon' dalla lista dei tab validi.

## 2026-06-28 (Bug fix, UX e rimozione coupon)

**Bug fix:**
- `sito.html`/`sito.js`: il titolo della sezione prenotazione era hardcoded "Prenota un tavolo" per tutti i tenant; ora è "Prenota un tavolo" (ristorante), "Prenota un appuntamento" (artigiano) o "Prenota una consulenza" (professionista).
- `prenotazioni.html`/`prenotazioni.js`: aggiunto input data accanto al filtro stato per filtrare le prenotazioni per giorno (la variabile `filterDate` esisteva già ma non aveva controllo UI).
- `prenotazioni.js`: la durata di fallback per le prenotazioni esistenti senza servizio associato ora usa `candidateDuration` (coerente con `sito.js`) invece di 30 min fissi — risolve lo sfasamento di slot tra sito pubblico e admin.
- `impostazioni.js`: `updateTabsVisibility()` ora legge lo stato live delle checkbox invece dei `hidden_features` caricati all'avvio, evitando tab visibili erroneamente dopo modifiche non salvate.
- `index.html`/`dashboard.js`: la voce "Eventi in programma" nel riepilogo dashboard ora si nasconde per attività non-ristorante o con la funzionalità eventi disattivata.

**UX:**
- `prenotazioni.html`/`prenotazioni.js`: aggiunta nota informativa sotto il campo "Stato" quando si crea una nuova prenotazione in modalità "Approvazione manuale".
- `clienti.js`: lo storico prenotazioni nella scheda anagrafica mostra ora anche il servizio e le note (prima solo data, ora, persone, stato).
- `menu.js`: il bottone "Nuova voce" si adatta al tipo: "+ Nuova voce menu" (ristorante) o "+ Nuova prestazione" (artigiano/professionista).
- `sito.js`: il link "Eventi" nella nav del sito pubblico si nasconde quando non ci sono eventi in programma.

**Rimozione coupon:**
- Rimossi completamente i coupon da tutto il codebase: tab Impostazioni, voce di menu laterale, form prenotazione sito pubblico, strutture dati (`db.js`), logica di validazione (`sito.js`). La funzionalità era opzionale e non più necessaria.

## 2026-06-27 (2) (Placeholder form contestuali per tipo di tenant)
- `menu.js`: il placeholder del campo "Categoria" nella modale voce menu/listino ora varia per tipo di attività: "es. Antipasti" per ristoranti, "es. Trattamenti viso" per artigiani/estetisti, "es. Consulenze" per professionisti.
- `impostazioni.html`/`impostazioni.js`: il placeholder "foto-locale.jpg" nell'URL copertina è ora generico ("copertina.jpg"); il messaggio di benvenuto cambia tra "nel nostro locale" (ristorante), "nel nostro salone" (artigiano) e "nel nostro studio" (professionista).
- `comunicazioni.js`: il placeholder dell'oggetto comunicazione passa da "Novità nel nostro menù" a testi specifici per artigiani ("Nuovi servizi disponibili") e professionisti ("Aggiornamento orari").

## 2026-06-27 (Collegamento anagrafica cliente → appuntamento)
- `clienti.html`/`clienti.js`: aggiunto il bottone "+ Appuntamento" su ogni riga dell'anagrafica clienti e nella scheda cliente; cliccando si viene portati direttamente alla pagina Prenotazioni con il form già aperto e i campi nome, email e telefono precompilati con i dati di quel cliente.
- `prenotazioni.html`/`prenotazioni.js`: la modale di nuova prenotazione ora accetta un cliente preimpostato (passato tramite URL param `?customer_id=`); la prenotazione salvata include il campo `customer_id` che lega in modo permanente l'appuntamento all'anagrafica, superando il collegamento fragile basato solo su email/telefono.
- `clienti.js`: lo storico prenotazioni nella scheda cliente ora ricerca per `customer_id` oltre che per email/telefono, mantenendo la retrocompatibilità con le prenotazioni precedenti prive di questo campo.

## 2026-06-25
- `prenotazioni.js`/`sito.js`: corretto un bug per cui il limite di capacità sulle prenotazioni sovrapposte pensato per le attività non-ristorante (basato sullo staff) veniva applicato per errore anche ai ristoranti con la funzionalità Tavoli disattivata, impedendo loro di accavallare le prenotazioni. Ora per questi ristoranti non c'è alcun limite di capacità; resta invece inalterato il limite basato sul numero di tavoli quando la funzionalità è attiva.

## 2026-06-22 (4)
- `clienti.html`/`clienti.js`: aggiunti i campi "Città" e "Provincia" all'anagrafica clienti, accanto all'Indirizzo già esistente. Mostrati uniti in un'unica riga nella scheda cliente (es. "Via Roma 1, Milano MI").

## 2026-06-22 (3)
- `prenotazioni.html`/`prenotazioni.js`: il campo "Persone" nella modale admin "Nuova prenotazione" parte ora da 1 (prima da 2).
- `sito.html`/`sito.js`: stesso default a 1 anche nel form pubblico di prenotazione (sito cliente), incluso il reset dopo l'invio di una nuova prenotazione.

## 2026-06-22 (2) (Servizi assegnabili a più persone dello staff)
- `impostazioni.html`/`impostazioni.js`: la colonna "Assegnato a" sui servizi ora è una selezione multipla (checkbox) invece di una singola persona — un servizio può richiedere competenze di più membri dello staff contemporaneamente disponibili.
- `prenotazioni.js`/`sito.js`: la capacità per i servizi senza tavoli ora è il numero di persone assegnate al servizio (se nessuna, il totale dello staff). Due servizi competono per la stessa disponibilità solo se assegnati esattamente allo stesso gruppo di persone (gruppi diversi, anche se si sovrappongono parzialmente, sono trattati come risorse indipendenti — per seguire la singola persona tra servizi diversi servirebbe un'assegnazione per-prenotazione, non per-servizio).
- Compatibilità mantenuta con i vecchi servizi salvati con la singola persona (`staff_id`): vengono letti automaticamente come gruppo di una persona.

## 2026-06-22 (Dashboard, sovrapposizione appuntamenti, capacità basata sullo staff)
- `index.html`/`dashboard.js`: i pulsanti Giornaliere/Mensili/Totali sopra le statistiche ora aggiornano anche la tabella "Prossime prenotazioni" sotto con lo stesso criterio (prima restava sempre fissa su "da oggi in poi" senza distinzione).
- `prenotazioni.js`/`sito.js`: corretto un bug per cui il controllo di disponibilità verificava solo l'orario di inizio identico, non la sovrapposizione di intervalli — un appuntamento di 45 minuti ora blocca correttamente tutta la sua finestra temporale, anche per slot generati con durate diverse.
- `style.css`: gli slot orario occupati nella modale prenotazioni sono ora evidenziati in rosso (prima erano dorati/tratteggiati, poco distinguibili dallo stile "selezionato").
- `prenotazioni.js`: la griglia "blocchi orari" usa sempre il passo del servizio più breve configurato, indipendentemente da quale servizio è selezionato nella prenotazione (prima la griglia cambiava interamente passo in base al servizio scelto, rendendo gli slot incoerenti tra una selezione e l'altra).
- `impostazioni.html`/`impostazioni.js`: nella tab Servizi, nuova colonna "Assegnato a" per associare un servizio a una persona specifica dello staff — visibile solo qui (lato gestione), il cliente non la vede mai sul sito pubblico.
- `prenotazioni.js`/`sito.js`/`db.js`: la capacità di prenotazioni sovrapposte per le attività senza tavoli (non-ristorante) ora è basata sul numero di persone in staff, non più fissa a 1. Se un servizio è assegnato a una persona specifica, contano come occupate solo le prenotazioni di quella persona (le altre risorse restano libere); se è assegnato a "Chiunque", la capacità è il totale dello staff. Il sito pubblico riceve solo il conteggio dello staff (`staffCount`), non i nomi, per non esporre dati sensibili.

## 2026-06-18 (Normalizzazione fine riga del repository)
- Aggiunto `.gitattributes` (`* text=auto eol=lf`): forza il salvataggio dei file di testo con fine riga LF, indipendentemente dall'editor/sistema operativo usato. Rinormalizzati tutti i file già presenti nel repo che erano stati salvati con CRLF (nessuna modifica al contenuto, solo ai caratteri di fine riga) — evita diff enormi e fuorvianti nei prossimi commit.

## 2026-06-18 (Funzionalità nascondibili estese: recensioni, comunicazioni, coupon, anagrafica clienti, fedeltà, preset per tipo, campi anagrafica)
- `db.js`: nuovi default automatici per i nuovi account in base al tipo di attività — `defaultHiddenFeatures(type)` e `defaultHiddenFields(type)` decidono quali funzionalità/campi sono attivi al primo avvio (Ristorante: Recensioni e Comunicazioni attive, Anagrafica clienti e Fedeltà disattive; Artigiano/Professionista: Comunicazioni e Anagrafica clienti attive, Recensioni e Fedeltà disattive; per l'Artigiano il campo "Codice fiscale" in anagrafica parte disattivato). Resta sempre possibile cambiare ogni preset manualmente in Impostazioni.
- `impostazioni.html`/`impostazioni.js`: la sezione "Funzionalità visibili" ora include anche Coupon, Recensioni, Comunicazioni, Programma fedeltà e Anagrafica clienti (oltre a Tavoli/Eventi/Staff già esistenti), ciascuna con una breve descrizione dell'effetto. Le tab "Staff"/"Postazioni"/"Coupon"/"Fedeltà" della pagina Impostazioni ora si nascondono insieme alla relativa funzionalità (prima restavano sempre visibili anche se disattivate dal menu). Aggiunti due sotto-toggle "Mostra data di nascita"/"Mostra codice fiscale" per l'anagrafica clienti.
- `layout.js`: le voci di menu "Recensioni", "Comunicazioni", "Coupon" e "Fedeltà" ora rispettano i nuovi toggle delle funzionalità.
- `clienti.html`/`clienti.js`: la sezione "Anagrafica clienti" non è più legata al tipo di attività (prima visibile solo per artigiani/professionisti) ma al nuovo toggle "Anagrafica clienti" in Impostazioni, attivabile per qualsiasi tipo di attività. Le colonne/campi "Data di nascita" e "Codice fiscale" si nascondono singolarmente in base ai nuovi sotto-toggle.

## 2026-06-18 (Blocchi orario per le prenotazioni, promemoria, anagrafica clienti, dashboard e calendario)
- `prenotazioni.html`/`prenotazioni.js`: la modale "Nuova/Modifica prenotazione" ora propone un selettore Servizio e dei blocchi orario (es. 10:00, 10:20, 10:40...) generati da orari di apertura, durata del servizio e disponibilità (tavoli/capacità) invece di un orario libero; gli slot già occupati restano selezionabili ma sono evidenziati. Aggiunta la checkbox "Inserisci come promemoria" che mostra un campo orario libero non vincolato agli slot/disponibilità (i promemoria non occupano i blocchi delle prenotazioni vere) e un badge "Promemoria" in tabella.
- `prenotazioni.html`/`prenotazioni.js`: aggiunta la navigazione del calendario anche per anno ("Anno prec./succ.") oltre al mese.
- `prenotazioni.js`: tabella prenotazioni e pillole del calendario ora ordinate in ordine cronologico crescente (prima erano a ritroso).
- `style.css`: nuovi stili `.slot-grid`/`.slot-btn` (blocchi orario) riutilizzati anche nella modale prenotazioni dell'admin.
- `db.js`: nuova collezione `customers` (anagrafica clienti) nel modello dati, inizializzata vuota per nuovi account e azzerata da "Ripristina dati di esempio"/cancellazione dati.
- `clienti.html`/`clienti.js`: per le attività di tipo artigiano/professionista, nuova sezione "Anagrafica clienti" con pulsante "+ Aggiungi cliente", form completo (nome, cognome, email, telefono, data di nascita, codice fiscale, indirizzo, note) e "scheda anagrafica" cliente con storico prenotazioni collegato (per email/telefono).
- `index.html`/`dashboard.js`: la card statistica "Prenotazioni" ora ha un filtro a pulsanti Giornaliere/Mensili/Totali invece delle due card fisse "oggi"/"questa settimana".

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
