const twilio = require('twilio');

class SmsService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
    this.isActive = this.accountSid && this.accountSid !== 'your_twilio_account_sid';

    if (this.isActive) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  async sendInvoiceSMS(to, customerName, invoiceNumber, amount) {
    // Format phone number to E.164 if missing country code. Assuming India (+91) for MVP
    let formattedPhone = to;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }

    const shopName = process.env.SHOP_NAME || 'Our Store';
    const messageBody = `Dear ${customerName},\n\nThank you for your purchase at ${shopName}!\nYour invoice #${invoiceNumber} for Rs.${amount} has been generated.\n\nWe appreciate your trust in us. Visit again!\n\nRegards,\n${shopName}`;

    if (!this.isActive) {
      console.log(`\n[SMS Service MOCK] 📱 Sending SMS to: ${formattedPhone}`);
      console.log(`[SMS Service MOCK] 📝 Message: \n${messageBody}\n`);
      return true;
    }

    try {
      const message = await this.client.messages.create({
        body: messageBody,
        from: this.fromPhone,
        to: formattedPhone,
      });
      console.log(`[SMS Service] Message sent successfully. SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('[SMS Error]:', error.message);
      return false;
    }
  }
}

module.exports = new SmsService();
