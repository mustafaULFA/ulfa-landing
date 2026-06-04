export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID || 3);

  if (!apiKey) {
    return res.status(500).json({ message: 'Server is missing BREVO_API_KEY.' });
  }

  try {
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true
      })
    });

    const data = await brevoResponse.json().catch(() => ({}));

    if (brevoResponse.ok) {
      return res.status(200).json({ ok: true, message: 'Subscribed.' });
    }

    if (
      brevoResponse.status === 400 &&
      (data.code === 'duplicate_parameter' || String(data.message || '').toLowerCase().includes('already exists'))
    ) {
      return res.status(200).json({ ok: true, message: 'Already subscribed.' });
    }

    console.error('Brevo error:', brevoResponse.status, data);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}
