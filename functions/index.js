const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

initializeApp();
const db = getFirestore();

// Configura questa secret con:
//   firebase functions:secrets:set RESEND_API_KEY
// Per ora contiene un placeholder e le email verranno solo loggate.
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const FROM_EMAIL = 'Reservo <notifiche@reservo.app>';

/**
 * Invia una email tramite Resend (https://resend.com).
 * Se RESEND_API_KEY non è configurata (placeholder), l'email viene solo loggata
 * senza essere effettivamente inviata: comodo per sviluppo/test.
 */
async function sendEmail({ to, subject, html }) {
  const apiKey = RESEND_API_KEY.value();
  if (!to || !apiKey || apiKey === 'PLACEHOLDER_RESEND_API_KEY') {
    logger.info('sendEmail (skipped, manca RESEND_API_KEY)', { to, subject });
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('Errore invio email Resend', { status: res.status, text });
  }
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Quando viene creata una nuova prenotazione tramite il sito pubblico,
 * invia una email di conferma/ricevuta al cliente (se ha indicato un'email).
 */
exports.onBookingCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const booking = event.data.data();
    if (!booking || !booking.email) return;

    let businessName = 'Reservo';
    try {
      const pubSnap = await db.doc(`businessPublic/${booking.businessUid}`).get();
      if (pubSnap.exists) {
        businessName = pubSnap.data().profile?.business_name || businessName;
      }
    } catch (err) {
      logger.warn('Impossibile leggere businessPublic', err);
    }

    const statusLabel = booking.status === 'confirmed' ? 'confermata' : 'in attesa di confermata';
    await sendEmail({
      to: booking.email,
      subject: `Prenotazione ricevuta - ${businessName}`,
      html: `
        <p>Ciao ${booking.customer_name || ''},</p>
        <p>Abbiamo ricevuto la tua richiesta di prenotazione presso <strong>${businessName}</strong>.</p>
        <ul>
          <li>Data: ${fmtDate(booking.date)}</li>
          <li>Ora: ${booking.time}</li>
          <li>Persone: ${booking.party_size}</li>
        </ul>
        <p>Stato attuale: <strong>${statusLabel}</strong>. Ti aggiorneremo non appena verrà confermata.</p>
        <p>Grazie, il team di ${businessName}</p>
      `,
    });
  }
);

/**
 * Quando lo stato di una prenotazione cambia (es. da "in attesa" a "confermata"
 * o "rifiutata"), invia una email di aggiornamento al cliente.
 */
exports.onBookingStatusChanged = onDocumentUpdated(
  { document: 'bookings/{bookingId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!after || !after.email) return;
    if (before.status === after.status) return;
    if (!['confirmed', 'rejected'].includes(after.status)) return;

    let businessName = 'Reservo';
    try {
      const pubSnap = await db.doc(`businessPublic/${after.businessUid}`).get();
      if (pubSnap.exists) {
        businessName = pubSnap.data().profile?.business_name || businessName;
      }
    } catch (err) {
      logger.warn('Impossibile leggere businessPublic', err);
    }

    const isConfirmed = after.status === 'confirmed';
    await sendEmail({
      to: after.email,
      subject: `Prenotazione ${isConfirmed ? 'confermata' : 'non disponibile'} - ${businessName}`,
      html: `
        <p>Ciao ${after.customer_name || ''},</p>
        <p>${isConfirmed
          ? `La tua prenotazione presso <strong>${businessName}</strong> per il ${fmtDate(after.date)} alle ${after.time} è stata <strong>confermata</strong>.`
          : `Siamo spiacenti, la tua richiesta di prenotazione presso <strong>${businessName}</strong> per il ${fmtDate(after.date)} alle ${after.time} non può essere accettata.`}</p>
        <p>Grazie, il team di ${businessName}</p>
      `,
    });
  }
);

/**
 * Ogni giorno alle 18:00 (Europe/Rome) invia un promemoria via email
 * ai clienti con prenotazione confermata per il giorno successivo.
 */
exports.sendBookingReminders = onSchedule(
  { schedule: '0 18 * * *', timeZone: 'Europe/Rome', secrets: [RESEND_API_KEY] },
  async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const snap = await db.collection('bookings')
      .where('date', '==', tomorrowStr)
      .where('status', '==', 'confirmed')
      .get();

    if (snap.empty) {
      logger.info('Nessun promemoria da inviare per', tomorrowStr);
      return;
    }

    const businessNames = {};
    for (const doc of snap.docs) {
      const booking = doc.data();
      if (!booking.email) continue;

      if (!(booking.businessUid in businessNames)) {
        const pubSnap = await db.doc(`businessPublic/${booking.businessUid}`).get();
        businessNames[booking.businessUid] = pubSnap.exists
          ? (pubSnap.data().profile?.business_name || 'Reservo')
          : 'Reservo';
      }
      const businessName = businessNames[booking.businessUid];

      await sendEmail({
        to: booking.email,
        subject: `Promemoria prenotazione - ${businessName}`,
        html: `
          <p>Ciao ${booking.customer_name || ''},</p>
          <p>Ti ricordiamo la tua prenotazione di domani presso <strong>${businessName}</strong>:</p>
          <ul>
            <li>Data: ${fmtDate(booking.date)}</li>
            <li>Ora: ${booking.time}</li>
            <li>Persone: ${booking.party_size}</li>
          </ul>
          <p>A presto, il team di ${businessName}</p>
        `,
      });
    }
  }
);

/**
 * Quando un account gestore passa da "pending" a "active" o "rejected"
 * (approvazione/rifiuto da parte dell'admin), invia una email di notifica
 * all'indirizzo dell'account.
 */
exports.onGestoreStatusChanged = onDocumentUpdated(
  { document: 'users/{uid}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!after || after.role !== 'gestore') return;
    if (before.status === after.status) return;
    if (!['active', 'rejected'].includes(after.status)) return;
    if (!after.email) return;

    const isApproved = after.status === 'active';
    await sendEmail({
      to: after.email,
      subject: isApproved ? 'La tua attività è stata approvata - Reservo' : 'Aggiornamento sulla tua richiesta - Reservo',
      html: isApproved
        ? `
          <p>Ciao ${after.name || ''},</p>
          <p>Buone notizie! La registrazione di <strong>${after.businessName || 'la tua attività'}</strong> su Reservo è stata <strong>approvata</strong>.</p>
          <p>Puoi accedere al gestionale per iniziare a configurare il tuo profilo.</p>
          <p>Grazie, il team di Reservo</p>
        `
        : `
          <p>Ciao ${after.name || ''},</p>
          <p>Siamo spiacenti, la richiesta di registrazione di <strong>${after.businessName || 'la tua attività'}</strong> su Reservo non è stata accettata.</p>
          <p>Per maggiori informazioni puoi contattare il nostro supporto.</p>
          <p>Grazie, il team di Reservo</p>
        `,
    });
  }
);

/**
 * Quando un'attività crea una comunicazione broadcast (collezione "broadcasts"),
 * invia il messaggio via email a tutti i clienti che hanno una prenotazione
 * presso quell'attività, poi aggiorna lo stato del documento.
 */
exports.onBroadcastCreated = onDocumentCreated(
  { document: 'broadcasts/{broadcastId}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const broadcast = event.data.data();
    if (!broadcast || !broadcast.businessUid) return;

    const pubSnap = await db.doc(`businessPublic/${broadcast.businessUid}`).get();
    const businessName = pubSnap.exists
      ? (pubSnap.data().profile?.business_name || 'Reservo')
      : 'Reservo';

    const bookingsSnap = await db.collection('bookings')
      .where('businessUid', '==', broadcast.businessUid)
      .get();

    const emails = new Set();
    bookingsSnap.forEach(doc => {
      const email = doc.data().email;
      if (email) emails.add(email);
    });

    let sentCount = 0;
    for (const email of emails) {
      await sendEmail({
        to: email,
        subject: broadcast.subject || `Comunicazione da ${businessName}`,
        html: `
          <p>${(broadcast.message || '').replace(/\n/g, '<br>')}</p>
          <p style="color:#888;font-size:0.85em">Hai ricevuto questa email perché hai effettuato una prenotazione presso ${businessName}.</p>
        `,
      });
      sentCount++;
    }

    await event.data.ref.update({
      status: 'sent',
      sent_count: sentCount,
      sent_at: new Date(),
    });
  }
);
