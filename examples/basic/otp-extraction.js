/**
 * OTP Extraction example: Wait for and extract verification codes
 *
 * Run with: node otp-extraction.js
 */

const { TempyEmail } = require('@tempyemail/e2e-testing');

async function main() {
  console.log('=== TempyEmail OTP Extraction Example ===\n');

  const client = new TempyEmail();
  const mailbox = await client.createMailbox();

  console.log(`✓ Created mailbox: ${mailbox.address}`);
  console.log(`\n📧 Send a verification email with an OTP code to:`);
  console.log(`   ${mailbox.address}\n`);

  console.log('⏳ Waiting for email with OTP (60s timeout)...\n');

  try {
    // Wait for OTP - automatically extracts common formats:
    // - 6-digit codes (123456)
    // - 4-8 digit codes
    // - Alphanumeric codes (ABC123)
    // - UUID tokens
    const otp = await mailbox.waitForOTP({ timeout: 60000 });

    console.log('✓ OTP extracted successfully!');
    console.log(`  Code: ${otp}`);
    console.log(`  Length: ${otp.length} characters`);

    // You can now use this OTP in your test
    console.log('\n💡 In a real test, you would now:');
    console.log('   1. Fill the OTP into your application');
    console.log('   2. Submit the verification form');
    console.log('   3. Assert the verification succeeded');
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log('✗ Timeout: No email received within 60 seconds');
    } else if (error.message.includes('No OTP code found')) {
      console.log('✗ Email received but no OTP code found in the content');
    } else {
      throw error;
    }
  }

  // Cleanup
  console.log('\n🗑️  Cleaning up...');
  await mailbox.delete();
  console.log('✓ Done');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
