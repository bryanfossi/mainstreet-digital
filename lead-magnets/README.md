# Lead Magnet Assets

Drop the final PDF here as `digital-health-check.pdf` (lowercase, hyphenated, exact name).

The `/api/lead-magnet` endpoint reads from `lead-magnets/digital-health-check.pdf`
when the `LEAD_MAGNET_MODE` environment variable is set to `pdf`.

## To switch from waitlist mode to PDF delivery

1. Save the final PDF as `lead-magnets/digital-health-check.pdf`.
2. Commit and push.
3. In the Vercel dashboard → Settings → Environment Variables, set
   `LEAD_MAGNET_MODE=pdf` (Production + Preview).
4. Redeploy. Existing subscribers on the waitlist will need to be re-emailed
   manually with the PDF (or via a one-off send from the leads table).

## File size

Keep the PDF under ~2 MB. Resend's free tier allows attachments up to ~40 MB
per email, but anything over a few MB is bad email-deliverability practice.
A 10-question checklist should comfortably fit in 200–500 KB.
