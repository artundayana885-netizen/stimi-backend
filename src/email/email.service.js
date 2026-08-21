const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetCode(toEmail, code) {
  await transporter.sendMail({
    from: `"SITMI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Código de recuperación de contraseña',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Recuperación de contraseña - SITMI</h2>
        <p>Tu código de verificación es:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>Este código expira en 10 minutos.</p>
      </div>
    `,
  });
}

module.exports = { sendResetCode };