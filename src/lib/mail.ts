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
  if (!user || !pass) {
    console.warn("GMAIL_USER or GMAIL_PASS not set; skipping email send.");
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: `"Music Mission Institute" <${user}>`,
    to,
    subject,
    html,
  });
}
