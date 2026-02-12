/**
 * Basic example: Create a mailbox and wait for an email
 *
 * Run with: node simple.js
 */

const { TempyEmail } = require('@tempyemail/e2e-testing');

async function main() {
  console.log('=== TempyEmail Simple Example ===\n');

  // Create client
  const client = new TempyEmail();
  console.log('✓ Client created');

  // Create a temporary mailbox
  const mailbox = await client.createMailbox();
  console.log(`✓ Mailbox created: ${mailbox.address}`);
  console.log(`  Expires at: ${mailbox.expiresAt.toLocaleString()}`);
  console.log(`  Seconds remaining: ${mailbox.secondsRemaining()}\n`);

  console.log('📧 Send an email to this address to test...');
  console.log(`   ${mailbox.address}\n`);

  // Wait for an email (60 second timeout)
  console.log('⏳ Waiting for email (60s timeout)...');
  try {
    const email = await mailbox.waitForEmail({ timeout: 60000 });

    console.log('\n✓ Email received!');
    console.log(`  From: ${email.from}`);
    console.log(`  Subject: ${email.subject}`);
    console.log(`  Received: ${email.receivedAt}`);
    console.log(`  Body preview: ${email.bodyText.substring(0, 100)}...`);
  } catch (error) {
    console.log(`\n✗ Timeout: No email received within 60 seconds`);
  }

  // Cleanup
  console.log('\n🗑️  Deleting mailbox...');
  await mailbox.delete();
  console.log('✓ Mailbox deleted');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
