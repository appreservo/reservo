/* Processa la "coda" di notifiche email: esiti prenotazioni (solo su richiesta
 * esplicita del gestore) e comunicazioni broadcast.
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

/* Invia l'email di esito (conferma o rifiuto) solo alle prenotazioni
 * per cui il gestore ha esplicitamente cliccato "Notifica via email". */
async function processNotifyRequested(db, businessNameCache) {
  const snap = await db.collection('bookings').where('notify_requested', '==', true).get();
  let count = 0;
  for (const doc of snap.docs) {
    const booking = doc.data();
    if (!booking.email) {
      await doc.ref.update({ notify_requested: false });
      continue;
    }
    const businessName = escapeHtml(await getBusinessName(db, booking.businessUid, businessNameCache));
    const isConfirmed = booking.status === 'confirmed';
    const reason = booking.rejection_reason;
    await sendEmail({
      to: booking.email,
      subject: `Prenotazione ${isConfirmed ? 'confermata' : 'non disponibile'} - ${businessName}`,
      html: `
        <p>Ciao ${escapeHtml(booking.customer_name)},</p>
        <p>${isConfirmed
          ? `La tua prenotazione presso <strong>${businessName}</strong> è stata <strong>confermata</strong>.`
          : `Siamo spiacenti, la tua richiesta di prenotazione presso <strong>${businessName}</strong> non può essere accettata.`}</p>
        <ul>
          <li>Data: ${fmtDate(booking.date)}</li>
          <li>Ora: ${escapeHtml(booking.time)}</li>
          <li>Persone: ${escapeHtml(String(booking.party_size))}</li>
        </ul>
        ${!isConfirmed && reason ? `<p>Motivazione: ${escapeHtml(reason)}</p>` : ''}
        <p>Grazie, il team di ${businessName}</p>
      `,
    });
    await doc.ref.update({ notify_requested: false, status_notified: booking.status });
    count++;
  }
  console.log(`Notifiche esito prenotazione inviate: ${count}`);
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
  await processNotifyRequested(db, businessNameCache);
  await processBroadcasts(db, businessNameCache);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
