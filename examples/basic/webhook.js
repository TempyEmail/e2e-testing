/**
 * Webhook example: Receive real-time email notifications
 *
 * Prerequisites:
 *   npm install express
 *
 * Run with: node webhook.js
 *
 * You'll need to expose your local server with ngrok or similar:
 *   npx ngrok http 3000
 */

const { TempyEmail } = require('@tempyemail/e2e-testing');
const express = require('express');

const app = express();
app.use(express.json());

let receivedEmails = [];

// Webhook endpoint - will be called when emails arrive
app.post('/webhook', (req, res) => {
  const email = req.body;

  console.log('\n📨 Webhook received!');
  console.log(`  From: ${email.from}`);
  console.log(`  Subject: ${email.subject}`);
  console.log(`  To: ${email.to}`);

  receivedEmails.push(email);
  res.sendStatus(200);
});

async function main() {
  console.log('=== TempyEmail Webhook Example ===\n');

  // Start webhook server
  const server = app.listen(3000, () => {
    console.log('✓ Webhook server listening on http://localhost:3000');
  });

  console.log('\n⚠️  Important: You need to expose this webhook publicly');
  console.log('   Run: npx ngrok http 3000');
  console.log('   Then update the webhookUrl below with your ngrok URL\n');

  // TODO: Replace with your public webhook URL
  const WEBHOOK_URL = 'https://YOUR-NGROK-URL.ngrok.io/webhook';

  if (WEBHOOK_URL.includes('YOUR-NGROK-URL')) {
    console.log('❌ Please update WEBHOOK_URL in the code with your ngrok URL');
    server.close();
    process.exit(1);
  }

  // Create mailbox with webhook
  const client = new TempyEmail();
  const mailbox = await client.createMailbox({
    webhookUrl: WEBHOOK_URL,
    webhookFormat: 'json',
  });

  console.log(`✓ Mailbox created with webhook: ${mailbox.address}`);
  console.log(`  Webhook URL: ${mailbox.webhookUrl}\n`);

  console.log('📧 Send emails to this address:');
  console.log(`   ${mailbox.address}\n`);
  console.log('⏳ Listening for webhooks... (Press Ctrl+C to stop)\n');

  // Keep the server running
  process.on('SIGINT', async () => {
    console.log('\n\n📊 Summary:');
    console.log(`  Total emails received: ${receivedEmails.length}`);

    console.log('\n🗑️  Cleaning up...');
    await mailbox.delete();
    server.close();
    console.log('✓ Done');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
