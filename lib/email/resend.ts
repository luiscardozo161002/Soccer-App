import { Resend } from "resend";

// No email provider configured (e.g. local dev without RESEND_API_KEY) is a
// valid, expected state — callers fall back to a dev-only delivery path
// instead of failing outright. What must never happen is treating "not
// configured" as "configured with an empty/placeholder key".
const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM;

export const emailDeliveryEnabled = Boolean(apiKey && fromAddress);

const client = apiKey ? new Resend(apiKey) : null;

const LOGO_CONTENT_ID = "logo";

export interface EmailBranding {
  siteName: string;
  primaryColor: string;
  // Sent as a CID attachment rather than a data: URI or a link to the app's
  // own URL: Gmail strips data: URIs from <img src> outright, and the app's
  // URL may not be reachable by the recipient's mail client (e.g. APP_URL
  // pointing at localhost in dev).
  logo: { content: string; contentType: string } | null;
}

// Table-based layout with every style inline: email clients (Outlook,
// Gmail) strip <style> blocks and don't support flexbox/backdrop-blur, so
// this can't reuse the app's Tailwind classes the way the login page does.
function passwordResetEmailHtml(resetUrl: string, { siteName, primaryColor, logo }: EmailBranding) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px; font-family:Arial, Helvetica, sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden;">
            <tr>
              <td align="center" style="background-color:#f1f5f9; padding:28px 24px;">
                ${
                  logo
                    ? `<img src="cid:${LOGO_CONTENT_ID}" alt="${siteName}" width="48" height="48" style="border-radius:9999px; border:2px solid rgba(15,23,42,0.1); background-color:#ffffff; object-fit:cover; margin-bottom:10px;" />`
                    : ""
                }
                <div style="color:#334155; font-size:16px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em;">${siteName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h1 style="margin:0 0 12px; font-size:20px; font-weight:800; color:#0f172a;">Restablece tu contraseña</h1>
                <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#475569;">
                  Solicitaste restablecer tu contraseña. Haz clic en el siguiente botón para elegir una nueva.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius:9999px; background-color:${primaryColor};">
                      <a href="${resetUrl}" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">
                        Restablecer contraseña
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0; font-size:12px; line-height:1.6; color:#94a3b8;">
                  Este enlace expira en 30 minutos. Si no fuiste tú, ignora este correo.
                </p>
                <p style="margin:16px 0 0; font-size:11px; line-height:1.6; color:#cbd5e1; word-break:break-all;">
                  ¿El botón no funciona? Copia y pega este enlace: ${resetUrl}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, branding: EmailBranding) {
  if (!client || !fromAddress) {
    throw new Error("Email delivery is not configured (RESEND_API_KEY / EMAIL_FROM)");
  }
  const { logo } = branding;
  const { error } = await client.emails.send({
    from: fromAddress,
    to,
    subject: "Restablece tu contraseña",
    html: passwordResetEmailHtml(resetUrl, branding),
    attachments: logo
      ? [
          {
            content: logo.content,
            filename: `logo.${logo.contentType.split("/")[1] ?? "png"}`,
            contentId: LOGO_CONTENT_ID,
          },
        ]
      : undefined,
  });
  // The Resend SDK reports API-level failures (e.g. unverified sender domain) via
  // this `error` field instead of throwing, so callers must check it explicitly.
  if (error) throw new Error(`Resend error: ${error.message}`);
}
