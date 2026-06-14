# Reservo - Cloud Functions

Questa cartella non contiene più funzioni attive: le notifiche email
(conferme prenotazione, cambi di stato, approvazioni gestore, comunicazioni
broadcast e promemoria) richiedevano il piano Firebase Blaze per il deploy
delle Cloud Functions, non disponibile su questo progetto (piano Spark).

La stessa logica è ora implementata in `../scripts/` ed eseguita
periodicamente tramite GitHub Actions (`../.github/workflows/`), usando
Firebase Admin SDK + Resend. Vedi `scripts/package.json` per il setup.
