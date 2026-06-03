import { Resend } from 'resend'

// Lazy initialization — avoids crash at build time when RESEND_API_KEY is not set
let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
  return _resend
}

const FROM = `${process.env.FROM_NAME ?? 'TalentAI'} <${process.env.FROM_EMAIL ?? 'no-reply@talentai.lk'}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://talentai.lk'

// ── Generic send ─────────────────────────────────────────────────────

export async function sendEmail(opts: {
  to: string
  subject: string
  template: string
  data: Record<string, unknown>
}) {
  const html = buildTemplate(opts.template, opts.data)
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html,
  })
}

// ── Specific senders ─────────────────────────────────────────────────

export async function sendVerificationEmail(opts: {
  to: string
  name: string
  userId: string
}) {
  // Generate a signed token (in production use a JWT or DB token)
  const token = Buffer.from(`${opts.userId}:${Date.now()}`).toString('base64url')
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`

  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: 'Verify your TalentAI.lk account',
    html: verificationTemplate({ name: opts.name, url }),
  })
}

export async function sendInvitationEmail(opts: {
  to: string
  contactName: string
  companyName: string
  token: string
  subscriptionTier: string
}) {
  const url = `${APP_URL}/onboarding?token=${opts.token}`
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `You've been invited to TalentAI.lk — ${opts.companyName}`,
    html: invitationTemplate({ ...opts, url }),
  })
}

export async function sendMagicLink(opts: { to: string; url: string }) {
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: 'Your TalentAI.lk sign-in link',
    html: magicLinkTemplate({ url: opts.url }),
  })
}

// ── HTML Templates ────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>TalentAI.lk</title>
</head>
<body style="margin:0;padding:0;background:#F4F6FF;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FF;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,61,224,0.08)">
  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#091875,#1B3DE0);padding:28px 32px;text-align:center">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">
        TalentAI<span style="opacity:0.6">.lk</span>
      </span>
    </td>
  </tr>
  <!-- Body -->
  <tr><td style="padding:32px">${content}</td></tr>
  <!-- Footer -->
  <tr>
    <td style="background:#F4F6FF;padding:20px 32px;text-align:center;border-top:1px solid #E8ECFF">
      <p style="margin:0;font-size:12px;color:#7580A0">
        TalentAI.lk — Sri Lanka's AI-native job platform<br/>
        <a href="${APP_URL}/unsubscribe" style="color:#1B3DE0;text-decoration:none">Unsubscribe</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function ctaButton(text: string, url: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0">
<tr><td style="background:linear-gradient(135deg,#1B3DE0,#4F6EFF);border-radius:10px;padding:0">
  <a href="${url}" style="display:block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;text-align:center">${text}</a>
</td></tr>
</table>`
}

function verificationTemplate(d: { name: string; url: string }) {
  return baseTemplate(`
<h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#07080F">Verify your email</h2>
<p style="color:#2E3345;font-size:15px;line-height:1.7;margin:0 0 8px">Hi ${d.name},</p>
<p style="color:#2E3345;font-size:15px;line-height:1.7;margin:0 0 20px">
  Click the button below to verify your email address and activate your TalentAI.lk account.
</p>
${ctaButton('Verify my email', d.url)}
<p style="color:#7580A0;font-size:13px;margin:16px 0 0">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
`)
}

function invitationTemplate(d: { contactName: string; companyName: string; subscriptionTier: string; url: string }) {
  const tierLabel = { free: 'Free', growth: 'Growth', enterprise: 'Enterprise' }[d.subscriptionTier] ?? d.subscriptionTier
  return baseTemplate(`
<h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#07080F">You've been invited</h2>
<p style="color:#2E3345;font-size:15px;line-height:1.7;margin:0 0 8px">Hi ${d.contactName},</p>
<p style="color:#2E3345;font-size:15px;line-height:1.7;margin:0 0 20px">
  TalentAI.lk has created an employer account for <strong>${d.companyName}</strong> on the <strong>${tierLabel} plan</strong>.
  Click below to set up your company profile and start posting jobs.
</p>
${ctaButton('Set up your company →', d.url)}
<p style="color:#7580A0;font-size:13px;margin:16px 0 0">This invitation expires in 7 days.</p>
`)
}

function magicLinkTemplate(d: { url: string }) {
  return baseTemplate(`
<h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#07080F">Your sign-in link</h2>
<p style="color:#2E3345;font-size:15px;line-height:1.7;margin:0 0 20px">
  Click the button below to sign in to TalentAI.lk. This link is valid for 10 minutes and can only be used once.
</p>
${ctaButton('Sign in to TalentAI.lk', d.url)}
<p style="color:#7580A0;font-size:13px;margin:16px 0 0">If you didn't request this, ignore it — your account is safe.</p>
`)
}

function buildTemplate(template: string, data: Record<string, unknown>): string {
  const templates: Record<string, (d: any) => string> = {
    'verification': verificationTemplate,
    'invitation': invitationTemplate,
    'magic-link': magicLinkTemplate,
    'application-status': (d) => baseTemplate(`
<h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#07080F">Application update</h2>
<p style="color:#2E3345;font-size:15px;line-height:1.7;margin:0 0 20px">
  Your application for <strong>${d.jobTitle}</strong> has been updated to: <strong>${d.status}</strong>.
</p>
${ctaButton('View your application', `${APP_URL}/applications/${d.applicationId}`)}
`),
  }
  return (templates[template] ?? (() => ''))(data)
}
