/* Processa la "coda" di notifiche email: prenotazioni nuove/aggiornate,
 * approvazione/rifiuto gestori, comunicazioni broadcast.
 * Pensato per essere eseguito periodicamente via GitHub Actions. */
const { initDb } = require('./lib/firebase');
const { sendEmail, fmtDate, escapeHtml } = require('./lib/email');

async function getBusinessName(db, businessUid, cache) {
  if (cache.has(businessUid)) return cache.get(businessUid);
  let name = 'Reservo';
  try {
    const snap = await db.doc(`businessPublic/${businessUid}`).get();
    if (snap.exists) name = snap.data().profile?.business_name || name;
  } catch (err) {
    console.warn('Impossibile leggere businessPublic', businessUid, err.message);
  }
  cache.set(businessUid, name);
  return name;
}

async function processNewBookings(db, businessNameCache) {
  const snap = await db.collection('bookings').where('notified', '==', false).get();
  for (const doc of snap.docs) {
    const booking = doc.data();
    if (booking.email) {
      const businessName = escapeHtml(await getBusinessName(db, booking.businessUid, businessNameCache));
      const statusLabel = booking.status === 'confirmed' ? 'confermata' : 'in attesa di conferma';
      await sendEmail({
        to: booking.email,
        subject: `Prenotazione ricevuta - ${businessName}`,
        html: `
          <p>Ciao ${escapeHtml(booking.customer_name)},</p>
          <p>Abbiamo ricevuto la tua richiesta di prenotazione presso <strong>${businessName}</strong>.</p>
          <ul>
            <li>Data: ${fmtDate(booking.date)}</li>
            <li>Ora: ${escapeHtml(booking.time)}</li>
            <li>Persone: ${escapeHtml(booking.party_size)}</li>
          </ul>
          <p>Stato attuale: <strong>${statusLabel}</strong>. Ti aggiorneremo non appena verrà confermata.</p>
          <p>Grazie, il team di ${businessName}</p>
        `,
      });
    }
    await doc.ref.update({ notified: true });
  }
  console.log(`Prenotazioni nuove notificate: ${snap.size}`);
}

async function processBookingStatusChanges(db, businessNameCache) {
  const snap = await db.collection('bookings')
    .where('status', 'in', ['confirmed', 'rejected'])
    .get();
  let count = 0;
  for (const doc of snap.docs) {
    const booking = doc.data();
    if (booking.status_notified === booking.status) continue;
    if (booking.email) {
      const businessName = escapeHtml(await getBusinessName(db, booking.businessUid, businessNameCache));
      const isConfirmed = booking.status === 'confirmed';
      const time = escapeHtml(booking.time);
      await sendEmail({
        to: booking.email,
        subject: `Prenotazione ${isConfirmed ? 'confermata' : 'non disponibile'} - ${businessName}`,
        html: `
          <p>Ciao ${escapeHtml(booking.customer_name)},</p>
          <p>${isConfirmed
            ? `La tua prenotazione presso <strong>${businessName}</strong> per il ${fmtDate(booking.date)} alle ${time} è stata <strong>confermata</strong>.`
            : `Siamo spiacenti, la tua richiesta di prenotazione presso <strong>${businessName}</strong> per il ${fmtDate(booking.date)} alle ${time} non può essere accettata.`}</p>
          <p>Grazie, il team di ${businessName}</p>
        `,
      });
    }
    await doc.ref.update({ status_notified: booking.status });
    count++;
  }
  console.log(`Cambi di stato prenotazione notificati: ${count}`);
}

async function processGestoreStatusChanges(db) {
  const snap = await db.collection('users')
    .where('role', '==', 'gestore')
    .where('status', 'in', ['active', 'rejected'])
    .get();
  let count = 0;
  for (const doc of snap.docs) {
    const user = doc.data();
    if (user.approval_notified === user.status) continue;
    if (user.email) {
      const isApproved = user.status === 'active';
      const name = escapeHtml(user.name);
      const businessName = escapeHtml(user.businessName || 'la tua attività');
      await sendEmail({
        to: user.email,
        subject: isApproved ? 'La tua attività è stata approvata - Reservo' : 'Aggiornamento sulla tua richiesta - Reservo',
        html: isApproved
          ? `
            <p>Ciao ${name},</p>
            <p>Buone notizie! La registrazione di <strong>${businessName}</strong> su Reservo è stata <strong>approvata</strong>.</p>
            <p>Puoi accedere al gestionale per iniziare a configurare il tuo profilo.</p>
            <p>Grazie, il team di Reservo</p>
          `
          : `
            <p>Ciao ${name},</p>
            <p>Siamo spiacenti, la richiesta di registrazione di <strong>${businessName}</strong> su Reservo non è stata accettata.</p>
            <p>Per maggiori informazioni puoi contattare il nostro supporto.</p>
            <p>Grazie, il team di Reservo</p>
          `,
      });
    }
    await doc.ref.update({ approval_notified: user.status });
    count++;
  }
  console.log(`Approvazioni/rifiuti gestore notificati: ${count}`);
}

async function processBroadcasts(db, businessNameCache) {
  const snap = await db.collection('broadcasts').where('status', '==', 'pending').get();
  for (const doc of snap.docs) {
    const broadcast = doc.data();
    if (!broadcast.businessUid) continue;
    const businessName = escapeHtml(await getBusinessName(db, broadcast.businessUid, businessNameCache));

    const bookingsSnap = await db.collection('bookings')
      .where('businessUid', '==', broadcast.businessUid)
      .get();

    const emails = new Set();
    bookingsSnap.forEach(b => {
      const email = b.data().email;
      if (email) emails.add(email);
    });

    let sentCount = 0;
    for (const email of emails) {
      await sendEmail({
        to: email,
        subject: broadcast.subject || `Comunicazione da ${businessName}`,
        html: `
          <p>${escapeHtml(broadcast.message).replace(/\n/g, '<br>')}</p>
          <p style="color:#888;font-size:0.85em">Hai ricevuto questa email perché hai effettuato una prenotazione presso ${businessName}.</p>
        `,
      });
      sentCount++;
    }

    await doc.ref.update({ status: 'sent', sent_count: sentCount, sent_at: new Date() });
  }
  console.log(`Comunicazioni broadcast inviate: ${snap.size}`);
}

(async () => {
  const db = initDb();
  const businessNameCache = new Map();
  await processNewBookings(db, businessNameCache);
  await processBookingStatusChanges(db, businessNameCache);
  await processGestoreStatusChanges(db);
  await processBroadcasts(db, businessNameCache);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
