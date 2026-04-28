export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const body = req.body || {};
  const firstName = String(body.first_name || '').trim();
  const lastName = String(body.last_name || '').trim();
  const businessName = String(body.business_name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const interest = String(body.interest || '').trim();
  const message = String(body.message || '').trim();

  if (!firstName || !lastName || !businessName || !email || !interest || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (message.length > 5000 || businessName.length > 200) {
    return res.status(400).json({ error: 'Input too long.' });
  }

  const escape = (s) => s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const interestLabels = {
    website: 'Website Design',
    social: 'Social Media Management',
    both: 'Both Website & Social Media',
    unsure: 'Not Sure Yet',
  };
  const interestLabel = interestLabels[interest] || interest;

  const subject = `New enquiry from ${firstName} ${lastName} — ${businessName}`;

  const text =
`New enquiry from the Main Street Digital Services website.

Name:      ${firstName} ${lastName}
Business:  ${businessName}
Email:     ${email}
Phone:     ${phone || '(not provided)'}
Interest:  ${interestLabel}

Message:
${message}
`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;color:#0A1628;">
      <h2 style="color:#0A1628;border-bottom:3px solid #2B7FFF;padding-bottom:8px;">New website enquiry</h2>
      <table style="border-collapse:collapse;width:100%;margin-top:16px;">
        <tr><td style="padding:6px 12px 6px 0;color:#555;"><strong>Name</strong></td><td style="padding:6px 0;">${escape(firstName)} ${escape(lastName)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#555;"><strong>Business</strong></td><td style="padding:6px 0;">${escape(businessName)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#555;"><strong>Email</strong></td><td style="padding:6px 0;"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#555;"><strong>Phone</strong></td><td style="padding:6px 0;">${escape(phone) || '<em style="color:#888;">(not provided)</em>'}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#555;"><strong>Interest</strong></td><td style="padding:6px 0;">${escape(interestLabel)}</td></tr>
      </table>
      <h3 style="margin-top:24px;color:#0A1628;">Message</h3>
      <p style="white-space:pre-wrap;line-height:1.5;background:#f6f8fb;padding:16px;border-radius:6px;">${escape(message)}</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Main Street Digital <enquiries@mainstreetdigitalservices.com>',
        to: ['bryan@mainstreetdigitalservices.com'],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', response.status, errText);
      return res.status(502).json({ error: 'Failed to send message.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
}
