// backend/utils/envValidator.js
// Validates all required environment variables on server startup.
// Stops the process immediately if any required variable is missing.

const REQUIRED_VARS = [
  { key: 'MYSQL_HOST', description: 'MySQL server host' },
  { key: 'MYSQL_PORT', description: 'MySQL server port' },
  { key: 'MYSQL_USER', description: 'MySQL username' },
  { key: 'MYSQL_PASSWORD', description: 'MySQL password' },
  { key: 'MYSQL_DATABASE', description: 'MySQL database name' },
  { key: 'MONGODB_URI', description: 'MongoDB connection string' },
  { key: 'JWT_SECRET', description: 'JWT signing secret' },
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
    console.error('\n[ENV Validator] Please check your environment configuration and provide all required keys.\n');
    process.exit(1);
  }

  console.log('[ENV Validator] ✅ All required environment variables validated successfully.');
};

export default validateEnv;
