const nodemailer = require("nodemailer");

/*
|--------------------------------------------------------------------------
| Mail transport
|--------------------------------------------------------------------------
|
| Gmail SMTP with an app password.
|
| .env:
|   SMTP_USER=you@gmail.com
|   SMTP_PASSWORD=the 16-character Google app password
|   MAIL_FROM_NAME=Gilgit Rental Platform   (optional)
|
| When SMTP is not configured the mail is not sent. In development the
| message is printed to the console instead so the flow can still be
| tested; in production the caller is told the mail failed.
|
*/

let cachedTransport = null;

const isConfigured = () =>
  Boolean(
    process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
  );

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
    });

  return cachedTransport;
};

const getFromAddress = () => {
  const name =
    process.env.MAIL_FROM_NAME ||
    "Gilgit Rental Platform";

  return `"${name}" <${process.env.SMTP_USER}>`;
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
      "Email not sent: SMTP_USER and SMTP_PASSWORD are not set"
    );

    return {
      sent: false,
      reason: "not_configured",
    };
  }

  try {
    await getTransport().sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
    });

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
