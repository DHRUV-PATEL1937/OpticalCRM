/**
 * WhatsApp Automation Service
 * This is a modular service designed to integrate with the official Meta WhatsApp Cloud API.
 * Currently, it logs the outgoing messages to the console for MVP purposes.
 * To activate real messaging, simply drop your ACCESS_TOKEN and PHONE_NUMBER_ID into .env.
 */

const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_TOKEN || 'MOCK_TOKEN';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_ID || 'MOCK_PHONE_ID';
    this.apiUrl = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;
    this.isActive = process.env.WHATSAPP_TOKEN ? true : false;
  }

  async sendMessage(to, templateName, components = []) {
    // In local development or MVP, we just mock the send
    if (!this.isActive) {
      console.log(`\n[WhatsApp Service MOCK] 📱 Sending message to: ${to}`);
      console.log(`[WhatsApp Service MOCK] 📝 Template: ${templateName}`);
      console.log(`[WhatsApp Service MOCK] 📦 Data: ${JSON.stringify(components)}\n`);
      return true;
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: components
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('[WhatsApp Error]:', error.response?.data || error.message);
      return false;
    }
  }

  async sendInvoice(phone, customerName, invoiceNumber, amount, pdfBuffer = null) {
    if (!phone) return;
    
    // Example template format matching Meta's structure with a document header
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: invoiceNumber },
          { type: 'text', text: `₹${amount}` }
        ]
      }
    ];

    if (pdfBuffer) {
      if (!this.isActive) {
        console.log(`[WhatsApp Service MOCK] 📎 Attached PDF (${pdfBuffer.length} bytes) to message.`);
      }
      // If active, you would normally upload the buffer to WhatsApp Media API here 
      // to get a media_id, then add a header component:
      // components.push({ type: 'header', parameters: [{ type: 'document', document: { /* id: mediaId, */ filename: `invoice-${invoiceNumber}.pdf` } }] });
    }

    await this.sendMessage(phone, 'invoice_receipt', components);
  }

  async sendPrescriptionReminder(phone, customerName) {
    if (!phone) return;
    const components = [{ type: 'body', parameters: [{ type: 'text', text: customerName }] }];
    await this.sendMessage(phone, 'eye_exam_reminder', components);
  }
}

module.exports = new WhatsAppService();
