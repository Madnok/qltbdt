const nodemailer = require('nodemailer');

async function sendEmail(to, subject, html) {
  try {
    // Cấu hình transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Nội dung email
    const mailOptions = {
      from: `IUHelp Facility Management <${process.env.EMAIL_USER}>`,
      to: to, 
      subject: subject,
      html: html,
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log('Đã gửi email: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Lỗi gửi Email:', error);
    return false;
  }
}

module.exports = { sendEmail };