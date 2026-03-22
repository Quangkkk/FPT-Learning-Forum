const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

async function sendVerificationEmail({ to, name, verifyUrl }) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Xac minh tai khoan Learning Forum",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:600px">
        <h2>Xin chao ${name || "ban"},</h2>
        <p>Cam on ban da dang ky tai khoan Learning Forum.</p>
        <p>Vui long bam vao nut ben duoi de xac minh email:</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;background:#0284c7;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">
            Xac minh email
          </a>
        </p>
        <p>Neu nut khong hoat dong, hay copy link nay vao trinh duyet:</p>
        <p>${verifyUrl}</p>
      </div>
    `
  });
}

module.exports = {
  sendVerificationEmail
};
