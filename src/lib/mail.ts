import "server-only";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends an email via Gmail SMTP.
 * Requires environment variables:
 * - GMAIL_USER (your gmail address)
 * - GMAIL_PASS (app password)
 */
export async function sendMail({ to, subject, html }: MailPayload) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const from =
    process.env.MAIL_FROM ||
    (user ? `"Music Mission GmbH" <${user}>` : `"Music Mission GmbH" <office@musicmission.at>`);
  if (!user || !pass) {
    console.warn("GMAIL_USER or GMAIL_PASS not set; skipping email send.");
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    console.info("sendMail success", { to, subject, messageId: info.messageId });
  } catch (err) {
    console.error("sendMail failed", err);
    throw err;
  }
}
