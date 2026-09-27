const nodemailer = require("nodemailer");

/*
|--------------------------------------------------------------------------
| Mail transport
|--------------------------------------------------------------------------
|
| Two ways to send, the first one configured wins:
|
| 1. Resend (HTTPS API) — needed on hosts that block SMTP, e.g. Railway's
|    Free / Trial / Hobby plans.
|      RESEND_API_KEY=re_...
|      MAIL_FROM_ADDRESS=no-reply@your-verified-domain.com
|      MAIL_FROM_NAME=Gilgit Rental Platform   (optional)
|    The from-address must be on a domain verified in Resend.
|
| 2. Gmail SMTP with an app password (fine locally and on hosts that allow
|    SMTP).
|      SMTP_USER=you@gmail.com
|      SMTP_PASSWORD=the 16-character Google app password
|      MAIL_FROM_NAME=Gilgit Rental Platform   (optional)
|
| When SMTP is not configured the mail is not sent. In development the
| message is printed to the console instead so the flow can still be
| tested; in production the caller is told the mail failed.
|
*/

let cachedTransport = null;

const usesResend = () =>
  Boolean(
    process.env.RESEND_API_KEY &&
      process.env.MAIL_FROM_ADDRESS
  );

const usesSmtp = () =>
  Boolean(
    process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
  );

const isConfigured = () => usesResend() || usesSmtp();

const fromName = () =>
  (process.env.MAIL_FROM_NAME || "Gilgit Rental Platform").replace(/["<>]/g, "");

const sendWithResend = async ({ to, subject, text, html }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName()} <${process.env.MAIL_FROM_ADDRESS}>`,
        to: [to],
        subject,
        text,
        html,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Resend answered ${response.status}: ${detail.slice(0, 300)}`);
    }
  } finally {
    clearTimeout(timer);
  }
};

const getTransport = () => {
  if (cachedTransport) {
    return cachedTransport;
  }

  cachedTransport =
    nodemailer.createTransport({
      host:
        process.env.SMTP_HOST ||
        "smtp.gmail.com",

      port: Number(
        process.env.SMTP_PORT || 465
      ),

      secure:
        Number(
          process.env.SMTP_PORT || 465
        ) === 465,

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },

      /*
      | Nodemailer's defaults wait up to 2 minutes to connect and 10 minutes
      | on a stalled socket. Signup awaits this call, and the browser gives
      | up after 15 seconds — so without these a blocked SMTP port makes
      | a successful signup look like a failure.
      */

      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

  return cachedTransport;
};

const getFromAddress = () => {
  const name =
    process.env.MAIL_FROM_NAME ||
    "Gilgit Rental Platform";

  return `"${name.replace(/["<>]/g, "")}" <${process.env.SMTP_USER}>`;
};

/*
|--------------------------------------------------------------------------
| Send one mail
|--------------------------------------------------------------------------
|
| Returns { sent: true } or { sent: false, reason }. Never throws, so a
| mail problem cannot turn a successful signup into a 500.
|
*/

const sendMail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!isConfigured()) {
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.log(
        [
          "",
          "----------------------------------------",
          " EMAIL NOT CONFIGURED - printing instead",
          "----------------------------------------",
          ` To      : ${to}`,
          ` Subject : ${subject}`,
          "",
          text,
          "----------------------------------------",
          "",
        ].join("\n")
      );

      return {
        sent: false,
        reason: "not_configured_logged",
      };
    }

    console.error(
      "Email not sent: set RESEND_API_KEY + MAIL_FROM_ADDRESS, or SMTP_USER + SMTP_PASSWORD"
    );

    return {
      sent: false,
      reason: "not_configured",
    };
  }

  try {
    if (usesResend()) {
      await sendWithResend({ to, subject, text, html });
    } else {
      await getTransport().sendMail({
        from: getFromAddress(),
        to,
        subject,
        text,
        html,
      });
    }

    return { sent: true };
  } catch (error) {
    console.error(
      "[Mail Error]",
      error?.message
    );

    return {
      sent: false,
      reason: "send_failed",
    };
  }
};

/*
|--------------------------------------------------------------------------
| Email verification message
|--------------------------------------------------------------------------
*/

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sendVerificationEmail = async ({
  to,
  name,
  verifyUrl,
}) => {
  const safeName = escapeHtml(
    name || "there"
  );

  const safeUrl = escapeHtml(verifyUrl);

  const text = [
    `Assalam o Alaikum ${name || "there"},`,
    "",
    "Confirm your email address to finish creating your Gilgit Rental Platform account:",
    "",
    verifyUrl,
    "",
    "This link works for 24 hours. If you did not create an account, you can ignore this email.",
  ].join("\n");

  const html = `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1322;padding:32px;color:#e2e8f0">
    <div style="max-width:560px;margin:0 auto;background:#111a2b;border:1px solid #1e293b;border-radius:20px;padding:32px">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#38bdf8">Gilgit Rental Platform</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#ffffff">Confirm your email</h1>
      <p style="margin:0 0 12px;line-height:1.6">Assalam o Alaikum ${safeName},</p>
      <p style="margin:0 0 24px;line-height:1.6">Please confirm this email address to finish creating your account.</p>
      <p style="margin:0 0 24px">
        <a href="${safeUrl}" style="display:inline-block;background:#38bdf8;color:#07101e;font-weight:bold;text-decoration:none;padding:14px 24px;border-radius:14px">Confirm my email</a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;color:#94a3b8">Or paste this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#7dd3fc">${safeUrl}</p>
      <p style="margin:0;font-size:12px;color:#64748b">This link works for 24 hours. If you did not create an account, ignore this email.</p>
    </div>
  </div>`;

  return sendMail({
    to,
    subject:
      "Confirm your email - Gilgit Rental Platform",
    text,
    html,
  });
};

module.exports = {
  isConfigured,
  sendMail,
  sendVerificationEmail,
};
