const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.isActive = !!process.env.SMTP_USER;
  }

  async sendInvoiceEmail(to, customerName, invoiceNumber, amount, pdfBuffer) {
    if (!this.isActive) {
      console.log(`\n[Email Service MOCK] 📧 Sending email to: ${to}`);
      console.log(`[Email Service MOCK] 📎 Attachment: invoice-${invoiceNumber}.pdf (${pdfBuffer.length} bytes)\n`);
      return true;
    }

    try {
      const mailOptions = {
        from: `"OpticalCRM" <${process.env.SMTP_USER}>`,
        to: to,
        subject: `Your Invoice #${invoiceNumber} from OpticalCRM`,
        text: `Dear ${customerName},\n\nThank you for your purchase. Please find attached your invoice for ₹${amount}.\n\nBest regards,\nOpticalCRM Team`,
        attachments: [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[Email Service] Invoice sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('[Email Error]:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
