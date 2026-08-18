import "server-only"

export type AuthEmailTemplate = {
  subject: string
  html: string
  text: string
}

const APP_NAME = "PDF Editor"

type EmailContent = {
  preheader: string
  eyebrow: string
  heading: string
  body: string
  otp: string
  footnote: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderOtpDigits(otp: string): string {
  const safeOtp = escapeHtml(otp)

  // Keep the code as one continuous selectable string so copy/paste works in
  // email clients. Letter-spacing creates the digit-box feel without splitting
  // the text nodes.
  return `
    <div style="display:inline-block;padding:14px 18px;border:1px solid #e7e5e4;background:#fafaf9;">
      <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:28px;font-weight:700;letter-spacing:0.42em;color:#1c1917;line-height:1;">
        ${safeOtp}
      </span>
    </div>`
}

function wrapEmail(subject: string, content: EmailContent): AuthEmailTemplate {
  const safeSubject = escapeHtml(subject)
  const safePreheader = escapeHtml(content.preheader)
  const safeEyebrow = escapeHtml(content.eyebrow)
  const safeHeading = escapeHtml(content.heading)
  const safeBody = escapeHtml(content.body)
  const safeFootnote = escapeHtml(content.footnote)
  const otpDigits = renderOtpDigits(content.otp)

  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f1ee;color:#1c1917;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      ${safePreheader}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f1ee;width:100%;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:0 0 20px;text-align:center;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#1c1917;">
                  ${escapeHtml(APP_NAME)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid #e8e4df;box-shadow:0 18px 50px rgba(28,25,23,0.06);overflow:hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="height:3px;background:linear-gradient(90deg,#1c1917 0%,#78716c 55%,#d6d3d1 100%);font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:36px 36px 12px;">
                      <p style="margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#a8a29e;">
                        ${safeEyebrow}
                      </p>
                      <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:600;color:#1c1917;">
                        ${safeHeading}
                      </h1>
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#57534e;">
                        ${safeBody}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 36px 8px;" align="center">
                      ${otpDigits}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 36px 36px;" align="center">
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;letter-spacing:0.04em;text-transform:uppercase;color:#a8a29e;">
                        Expires in 5 minutes
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 36px;">
                      <div style="height:1px;background:#f0ece7;font-size:0;line-height:0;">&nbsp;</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 36px 32px;">
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#a8a29e;">
                        ${safeFootnote}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px 0;text-align:center;">
                <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a8a29e;">
                  Sent by ${escapeHtml(APP_NAME)} · Secure authentication mail
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `${APP_NAME}

${content.heading}

${content.body}

Your code: ${content.otp}

Expires in 5 minutes.

${content.footnote}`,
  }
}

export function buildEmailVerificationOtpEmail(otp: string): AuthEmailTemplate {
  return wrapEmail(`Verify your email · ${APP_NAME}`, {
    preheader: `Your verification code is ${otp}. It expires in 5 minutes.`,
    eyebrow: "Email verification",
    heading: "Confirm it’s you",
    body: "Enter this one-time code in PDF Editor to verify your email and finish setting up your account.",
    otp,
    footnote:
      "If you didn’t create an account, you can ignore this message. Someone may have entered your email by mistake.",
  })
}

export function buildPasswordResetOtpEmail(otp: string): AuthEmailTemplate {
  return wrapEmail(`Reset your password · ${APP_NAME}`, {
    preheader: `Your password reset code is ${otp}. It expires in 5 minutes.`,
    eyebrow: "Password reset",
    heading: "Reset your password",
    body: "Use this one-time code to choose a new password for your PDF Editor account.",
    otp,
    footnote:
      "If you didn’t request a password reset, you can ignore this email. Your current password will stay the same.",
  })
}

export function buildSignInOtpEmail(otp: string): AuthEmailTemplate {
  return wrapEmail(`Your sign-in code · ${APP_NAME}`, {
    preheader: `Your sign-in code is ${otp}. It expires in 5 minutes.`,
    eyebrow: "Secure sign-in",
    heading: "Your sign-in code",
    body: "Enter this one-time code to sign in to PDF Editor. For your security, don’t share it with anyone.",
    otp,
    footnote:
      "If you didn’t try to sign in, you can ignore this email. No changes were made to your account.",
  })
}
