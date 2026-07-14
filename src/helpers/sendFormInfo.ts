import nodemailer from "nodemailer";
import config from "../config";
const sendFormInfo = async (to: string, subject: string, html: string) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: "mx2ea5.netcup.net",
    port: 587,
    secure: false,
    auth: {
      user: "info@uenal-immobilien.de",
      pass: "fWck*4918",
    },
  });

  // Email options
  const mailOptions = {
    from: `"Uenal Immobilien GmbH" <${config.emailSender.email}>`,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

export default sendFormInfo;
