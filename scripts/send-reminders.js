/* Invia un promemoria via email ai clienti con prenotazione confermata per
 * il giorno successivo. Pensato per essere eseguito una volta al giorno
 * via GitHub Actions (cron). */
const { initDb } = require('./lib/firebase');
const { sendEmail, fmtDate } = require('./lib/email');

(async () => {
  const db = initDb();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const snap = await db.collection('bookings')
    .where('date', '==', tomorrowStr)
    .where('status', '==', 'confirmed')
    .get();

  if (snap.empty) {
    console.log('Nessun promemoria da inviare per', tomorrowStr);
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
  console.log(`Promemoria inviati per ${tomorrowStr}: ${snap.size}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
