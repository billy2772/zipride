// backend/utils/envValidator.js
// Validates all required environment variables on server startup.
// Stops the process immediately if any required variable is missing.

const REQUIRED_VARS = [
  { key: 'PORT', description: 'Express server port number' },
  { key: 'MYSQL_HOST', description: 'MySQL server host' },
  { key: 'MYSQL_PORT', description: 'MySQL server port' },
  { key: 'MYSQL_DATABASE', description: 'MySQL database name' },
  { key: 'MYSQL_USER', description: 'MySQL username' },
  { key: 'MYSQL_PASSWORD', description: 'MySQL password' },
  { key: 'JWT_SECRET', description: 'JWT signing secret' },
];

const OPTIONAL_VARS = [
  'FIREBASE_API_KEY',
  'GEOAPIFY_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

export const validateEnv = () => {
  const missing = [];

  for (const variable of REQUIRED_VARS) {
    const value = process.env[variable.key];
    if (!value || value.trim() === '') {
      missing.push(`  ❌ ${variable.key.padEnd(20)} - ${variable.description}`);
    }
  }

  if (missing.length > 0) {
    console.error('\n[ENV Validator] ❌ Server startup aborted — missing required environment variables:\n');
    missing.forEach(m => console.error(m));
    console.error('\n[ENV Validator] Please copy .env.example to .env and fill in all required values.\n');
    process.exit(1);
  }

  // Warn about optional missing vars
  const missingOptional = OPTIONAL_VARS.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('[ENV Validator] ⚠️  Optional variables not set (features may be degraded):', missingOptional.join(', '));
  }

  console.log('[ENV Validator] ✅ All required environment variables validated successfully.');
};

export default validateEnv;
