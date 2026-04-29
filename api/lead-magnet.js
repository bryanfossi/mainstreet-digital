import fs from 'node:fs/promises';
import path from 'node:path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const LEAD_MAGNET_MODE = (process.env.LEAD_MAGNET_MODE || 'waitlist').toLowerCase();

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // 1. Insert lead into Supabase (best-effort — non-fatal if it fails)
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sbResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal,resolution=merge-duplicates',
        },
        body: JSON.stringify({
          name: name || null,
          email,
          source: 'health-check',
          submitted_at: new Date().toISOString(),
        }),
      });

      if (!sbResponse.ok && sbResponse.status !== 409) {
        const errText = await sbResponse.text();
        console.error('Supabase insert error:', sbResponse.status, errText);
      }
    } catch (err) {
      console.error('Supabase fetch error:', err);
    }
  } else {
    console.warn('Supabase not configured — skipping lead persistence.');
  }

  // 2. Build the confirmation email (waitlist vs PDF mode)
  const isPdfMode = LEAD_MAGNET_MODE === 'pdf';
  const greetingName = name ? escapeHtml(name) : 'there';
  const subject = isPdfMode
    ? 'Your Local Business Digital Health Check'
    : "You're on the list — Health Check coming soon";

  const textBody = isPdfMode
    ? buildPdfText(greetingName)
    : buildWaitlistText(greetingName);
  const htmlBody = isPdfMode
    ? buildPdfHtml(greetingName)
    : buildWaitlistHtml(greetingName);

  const emailPayload = {
    from: 'Main Street Digital <hello@mainstreetdigitalservices.com>',
    to: [email],
    subject,
    text: textBody,
    html: htmlBody,
    reply_to: 'bryan@mainstreetdigitalservices.com',
  };

  // 3. Attach PDF if in PDF mode and the file exists
  if (isPdfMode) {
    try {
      const pdfPath = path.join(process.cwd(), 'lead-magnets', 'digital-health-check.pdf');
      const pdfBuffer = await fs.readFile(pdfPath);
      emailPayload.attachments = [
        {
          filename: 'Local-Business-Digital-Health-Check.pdf',
          content: pdfBuffer.toString('base64'),
        },
      ];
    } catch (err) {
      console.error('PDF attachment failed — falling back to waitlist email:', err);
      emailPayload.subject = "You're on the list — Health Check coming soon";
      emailPayload.text = buildWaitlistText(greetingName);
      emailPayload.html = buildWaitlistHtml(greetingName);
    }
  }

  // 4. Send via Resend
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      console.error('Resend error:', resendResponse.status, errText);
      return res.status(502).json({ error: 'Failed to send confirmation email.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend fetch error:', err);
    return res.status(500).json({ error: 'Failed to send confirmation email.' });
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function buildWaitlistText(name) {
  return `Hi ${name},

Thanks for asking for the Local Business Digital Health Check.

We're putting the finishing touches on the new edition. The moment it drops, we'll email it your way — typically within the next two weeks.

If you'd rather just talk through your business with a real person now, you can book a free 30-minute consultation here:
https://mainstreetdigitalservices.com/contact

Talk soon,
Bryan & Jared
Main Street Digital Services
https://mainstreetdigitalservices.com
`;
}

function buildPdfText(name) {
  return `Hi ${name},

Your Local Business Digital Health Check is attached.

It's a 10-question self-audit covering the essentials: website performance, Google Business Profile, social media consistency, and more. Set aside 15 minutes, run through the checklist, and you'll know exactly where to focus.

When you're ready to talk through your results, book a free 30-minute consultation:
https://mainstreetdigitalservices.com/contact

— Bryan & Jared
Main Street Digital Services
https://mainstreetdigitalservices.com
`;
}

function emailLayout(headline, bodyHtml) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F4F6FA;font-family:Inter,Arial,sans-serif;color:#1A1A2E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(10,22,40,0.08);">
        <tr><td style="background:#0A1628;padding:24px 32px;">
          <p style="margin:0;color:#C6A96B;font-size:0.78rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">Main Street Digital Services</p>
          <h1 style="margin:0.5rem 0 0;color:#ffffff;font-size:1.4rem;font-weight:700;line-height:1.3;">${headline}</h1>
        </td></tr>
        <tr><td style="padding:32px;color:#1A1A2E;font-size:15px;line-height:1.65;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="background:#F4F6FA;padding:20px 32px;color:#6B7280;font-size:12px;text-align:center;">
          Bryan &amp; Jared · Main Street Digital Services<br>
          Lancaster, Dauphin, Cumberland &amp; Berks Counties, PA
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildWaitlistHtml(name) {
  const body = `
    <p style="margin:0 0 1rem;">Hi ${name},</p>
    <p style="margin:0 0 1rem;">Thanks for asking for the <strong>Local Business Digital Health Check</strong>. We're putting the finishing touches on the new edition.</p>
    <p style="margin:0 0 1.5rem;">The moment it drops we'll email it your way — typically within the next two weeks.</p>
    <p style="margin:0 0 1rem;">If you'd rather just talk through your business with a real person now, you can book a free 30-minute consultation any time:</p>
    <p style="margin:0 0 1.5rem;"><a href="https://mainstreetdigitalservices.com/contact" style="display:inline-block;background:#2B7FFF;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px;">Book a Free Consult</a></p>
    <p style="margin:0;color:#6B7280;font-size:13px;">— Bryan &amp; Jared</p>
  `;
  return emailLayout("You're on the list", body);
}

function buildPdfHtml(name) {
  const body = `
    <p style="margin:0 0 1rem;">Hi ${name},</p>
    <p style="margin:0 0 1rem;">Your <strong>Local Business Digital Health Check</strong> is attached to this email — a 10-question self-audit covering the essentials: website performance, Google Business Profile, social media consistency, and more.</p>
    <p style="margin:0 0 1.5rem;">Set aside 15 minutes, run through the checklist, and you'll know exactly where to focus.</p>
    <p style="margin:0 0 1rem;">When you're ready to talk through your results:</p>
    <p style="margin:0 0 1.5rem;"><a href="https://mainstreetdigitalservices.com/contact" style="display:inline-block;background:#2B7FFF;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px;">Book a Free Consult</a></p>
    <p style="margin:0;color:#6B7280;font-size:13px;">— Bryan &amp; Jared</p>
  `;
  return emailLayout('Your Digital Health Check is here', body);
}
