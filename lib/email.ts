import nodemailer from 'nodemailer'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  const missing = [
    !host ? 'SMTP_HOST' : null,
    !user ? 'SMTP_USER' : null,
    !pass ? 'SMTP_PASS' : null,
  ].filter(Boolean) as string[]

  if (missing.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missing.join(', ')}`)
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
}

export async function sendOTPEmail(email: string, otp: string, name?: string) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM || 'Midlync.com <no-reply@midlync.com>'
  const subject = 'Verify your Midlync account'
  const year = new Date().getFullYear()

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
            <div style="font-size:14px;font-weight:700;letter-spacing:1px;color:#0f172a;margin-bottom:16px;">Midlync</div>
            <h2 style="margin:0 0 12px;color:#0f172a;font-size:24px;">Email Verification OTP</h2>
            <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hello ${name || 'User'},</p>
            <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Use the OTP below to verify your email address. This code expires in 5 minutes.</p>
            <div style="margin:24px 0;padding:18px 16px;background:#ecfeff;border:1px solid #67e8f9;border-radius:12px;text-align:center;">
              <div style="font-size:34px;letter-spacing:8px;font-weight:800;color:#0891b2;">${otp}</div>
            </div>
            <p style="margin:0;color:#64748b;line-height:1.6;">If you did not request this, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">© ${year} Midlync. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text: `Your Midlync OTP is ${otp}. This code expires in 5 minutes.`,
    html,
  })
}
