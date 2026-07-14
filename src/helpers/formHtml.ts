export const formHtml = (payload: any) => {
  const fullName =
    [payload.firstName, payload.lastName].filter(Boolean).join(" ") ||
    "Unknown";

  return `
  <!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb;margin:0;padding:32px 12px;">
      <tr>
        <td align="center">
          
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:700px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px rgba(17,24,39,0.08);">
            
            <!-- Top Bar -->
            <tr>
              <td style="height:6px;background:linear-gradient(90deg,#111827,#374151,#6b7280);font-size:0;line-height:0;">&nbsp;</td>
            </tr>

            <!-- Header -->
            <tr>
              <td style="padding:32px 36px;background-color:#111827;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left">
                      
                      <h1 style="margin:18px 0 8px;font-size:28px;line-height:36px;color:#ffffff;font-weight:700;">
                        Neue Formularübermittlung
                      </h1>
                      <p style="margin:0;font-size:15px;line-height:24px;color:#d1d5db;">
                        Eine neue Anfrage wurde über Ihre Website erfolgreich eingereicht.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Intro -->
            <tr>
              <td style="padding:28px 36px 8px 36px;">
                <p style="margin:0;font-size:15px;line-height:24px;color:#4b5563;">
                  Nachfolgend finden Sie die übermittelten Kontaktdaten und Angaben in einer übersichtlichen Tabelle.
                </p>
              </td>
            </tr>

            <!-- Info Card Table -->
            <tr>
              <td style="padding:20px 36px 36px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background-color:#ffffff;">
                  
                  <tr>
                    <td colspan="2" style="padding:16px 20px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;">
                      <span style="font-size:16px;font-weight:700;color:#111827;">Anfragedetails</span>
                    </td>
                  </tr>

                  <tr>
                    <td width="35%" style="padding:14px 20px;background-color:#fcfcfd;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#6b7280;">
                      Name
                    </td>
                    <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#111827;">
                      ${fullName}
                    </td>
                  </tr>

                  <tr>
                    <td width="35%" style="padding:14px 20px;background-color:#fcfcfd;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#6b7280;">
                      E-Mail
                    </td>
                    <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#111827;">
                      ${payload.email || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td width="35%" style="padding:14px 20px;background-color:#fcfcfd;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#6b7280;">
                      Telefon
                    </td>
                    <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#111827;">
                      ${payload.phone || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td width="35%" style="padding:14px 20px;background-color:#fcfcfd;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#6b7280;">
                      Immobilientyp
                    </td>
                    <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#111827;">
                      ${payload.propertyType || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td width="35%" style="padding:14px 20px;background-color:#fcfcfd;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#6b7280;">
                      Standort
                    </td>
                    <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;font-size:15px;font-weight:600;color:#111827;">
                      ${payload.location || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td width="35%" style="padding:14px 20px;background-color:#fcfcfd;vertical-align:top;font-size:14px;font-weight:600;color:#6b7280;">
                      Details
                    </td>
                    <td style="padding:14px 20px;font-size:15px;line-height:24px;font-weight:600;color:#111827;">
                      ${payload.details || "-"}
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:22px 36px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:13px;line-height:22px;color:#6b7280;">
                  Diese E-Mail wurde automatisch über das Kontaktformular Ihrer Website erstellt.
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};
