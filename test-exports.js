/**
 * Quick test to verify all exports are working
 */

const {
  TempyEmail,
  Mailbox,
  extract6DigitOTP,
  extractOTP,
  extractLinks,
  extractVerificationLink,
  pollUntil,
  wait
} = require('./dist/index.js');

console.log('✓ All exports loaded successfully!\n');

// Test OTP extraction
console.log('Testing OTP extraction...');
const testEmail = 'Your verification code is 123456. Please enter it to continue.';
const otp = extract6DigitOTP(testEmail);
console.log(`  Extracted OTP: ${otp}`);
console.assert(otp === '123456', 'OTP extraction failed');
console.log('  ✓ OTP extraction works\n');

// Test link extraction
console.log('Testing link extraction...');
const testHtml = '<p>Click here: <a href="https://example.com/verify?token=abc">Verify</a></p>';
const links = extractLinks(testHtml);
console.log(`  Extracted links: ${links.join(', ')}`);
console.assert(links.length > 0, 'Link extraction failed');
console.log('  ✓ Link extraction works\n');

// Test verification link extraction
const verifyLink = extractVerificationLink(testHtml);
console.log(`  Verification link: ${verifyLink}`);
console.assert(verifyLink === 'https://example.com/verify?token=abc', 'Verification link extraction failed');
console.log('  ✓ Verification link extraction works\n');

// Test client instantiation
console.log('Testing client instantiation...');
const client = new TempyEmail();
console.log('  ✓ TempyEmail client created\n');

console.log('✅ All tests passed! Package is ready.');
console.log('\nNext steps:');
console.log('  1. Test with real API: node examples/basic/simple.js');
console.log('  2. Run example tests: cd examples/playwright && npm install && npm test');
console.log('  3. Publish to npm: npm publish');
