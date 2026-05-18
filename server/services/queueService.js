const { Queue, Worker } = require('bullmq');
const whatsappService = require('./whatsappService');
const config = require('../config');

// By default, assume Redis is not running locally to prevent ECONNREFUSED crashes.
// To use Redis queues, set USE_REDIS=true in .env
const useRedis = process.env.USE_REDIS === 'true';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
};

let messageQueue;

if (useRedis) {
  try {
    messageQueue = new Queue('whatsapp-messages', { connection });

    const worker = new Worker('whatsapp-messages', async job => {
      const { phone, templateName, components } = job.data;
      console.log(`[Queue Worker] Processing job ${job.id} for phone ${phone}`);
      try {
        await whatsappService.sendMessage(phone, templateName, components);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[Queue Worker] Job ${job.id} failed:`, err.message);
        throw err;
      }
    }, { connection, concurrency: 5 });

    worker.on('completed', job => console.log(`[Queue Worker] Job ${job.id} completed successfully`));
    worker.on('failed', (job, err) => console.log(`[Queue Worker] Job ${job.id} failed with error ${err.message}`));
    worker.on('error', err => console.log(`[Queue Worker Redis Error]`, err.message));
  } catch (err) {
    console.log('[Queue Service] Could not initialize Redis queue.');
  }
} else {
  console.log('[Queue Service] Running without Redis (USE_REDIS=false). Messages will process synchronously.');
}

const addToMessageQueue = async (phone, templateName, components) => {
  if (useRedis && messageQueue) {
    try {
      await messageQueue.add('send-message', { phone, templateName, components }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      });
      return true;
    } catch (err) {
      console.error('Failed to add message to queue', err);
      return false;
    }
  } else {
    // Fallback: send synchronously (fire and forget for local dev)
    whatsappService.sendMessage(phone, templateName, components).catch(err => console.error(err));
    return true;
  }
};

module.exports = { messageQueue, addToMessageQueue };
