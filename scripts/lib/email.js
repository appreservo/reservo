const FROM_EMAIL = 'Reservo <notifiche@reservo.app>';

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    console.log('sendEmail (skipped, manca RESEND_API_KEY)', { to, subject });
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
    console.error('Errore invio email Resend', res.status, text);
  }
}

module.exports = { sendEmail, fmtDate };
