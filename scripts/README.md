# Reservo - script email (GitHub Actions + Resend)

Sostituiscono le vecchie Cloud Functions email (rimosse perché richiedevano
il piano Blaze). Eseguiti periodicamente dai workflow in
`../.github/workflows/`:

- `send-emails.js` - ogni 15 minuti: conferme prenotazione, cambi di stato
  prenotazione, approvazione/rifiuto gestori, comunicazioni broadcast.
- `send-reminders.js` - una volta al giorno (17:00 UTC ≈ 18:00 Europe/Rome):
  promemoria per le prenotazioni confermate del giorno dopo.

## Setup richiesto (GitHub repo Settings → Secrets and variables → Actions)

1. **`FIREBASE_SERVICE_ACCOUNT`**: contenuto JSON completo di una chiave di
   servizio Firebase (Project Settings → Service accounts → Generate new
   private key nel progetto `appreservo-92b7c`).
2. **`RESEND_API_KEY`**: API key di [Resend](https://resend.com) (piano free:
   100 email/giorno, 3000/mese). Se non impostata, le email vengono solo
   loggate nei log della Action e non inviate.

Il mittente è definito in `lib/email.js` (`FROM_EMAIL`,
`Reservo <notifiche@reservo.app>`) — va sostituito con un dominio verificato
sul proprio account Resend prima dell'uso in produzione.

## Esecuzione manuale

Entrambi i workflow hanno `workflow_dispatch`, quindi possono essere avviati
manualmente dalla tab "Actions" di GitHub per testare la pipeline.
