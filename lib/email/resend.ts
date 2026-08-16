import { Resend } from "resend";

// No email provider configured (e.g. local dev without RESEND_API_KEY) is a
// valid, expected state — callers fall back to a dev-only delivery path
// instead of failing outright. What must never happen is treating "not
// configured" as "configured with an empty/placeholder key".
const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM;

export const emailDeliveryEnabled = Boolean(apiKey && fromAddress);

const client = apiKey ? new Resend(apiKey) : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!client || !fromAddress) {
    throw new Error("Email delivery is not configured (RESEND_API_KEY / EMAIL_FROM)");
  }
  const { error } = await client.emails.send({
    from: fromAddress,
    to,
    subject: "Restablece tu contraseña",
    html: `
      <p>Solicitaste restablecer tu contraseña.</p>
      <p><a href="${resetUrl}">Restablecer contraseña</a></p>
      <p>Este enlace expira en 30 minutos. Si no fuiste tú, ignora este correo.</p>
    `,
  });
  // The Resend SDK reports API-level failures (e.g. unverified sender domain) via
  // this `error` field instead of throwing, so callers must check it explicitly.
  if (error) throw new Error(`Resend error: ${error.message}`);
}
