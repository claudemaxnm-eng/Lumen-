// api/book.js
// Sends the booking to a Make.com webhook. Make then creates the Google
// Calendar event AND sends the confirmation email — no Google Cloud, no Resend.
//
// Env var in Vercel (Settings -> Environment Variables):
//   MAKE_WEBHOOK_URL = the webhook URL Make gives you (https://hook.../...)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, date, time, service, duration, notes } = req.body || {};
    if (!name || !email || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build start / end ISO times so Make can drop them straight into Calendar.
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + (Number(duration) || 60) * 60000);

    const payload = {
      name,
      email,
      service: service || 'Session',
      duration: Number(duration) || 60,
      notes: notes || '',
      date,
      time,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    };

    const r = await fetch(process.env.MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('Make webhook returned ' + r.status);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({ error: 'Booking failed', detail: String(err.message || err) });
  }
}
