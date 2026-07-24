// Script to generate a local development .env file with safe placeholders.
import crypto from 'crypto';
import fs from 'fs';

const sessionSecret = crypto.randomBytes(32).toString('hex');
const databaseUrl = process.env.DATABASE_URL || 'postgresql://USER:PASSWORD@HOST:5432/DATABASE';

const envContent = `# Database Configuration
DATABASE_URL=${databaseUrl}

# Session Secret (auto-generated)
SESSION_SECRET=${sessionSecret}

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000
`;

fs.writeFileSync('.env', envContent);

console.log('.env file created successfully.');
console.log('\nGenerated local SESSION_SECRET:');
console.log(sessionSecret);
console.log('\nYour .env file has been created with:');
console.log('- DATABASE_URL placeholder or value from the current process environment');
console.log('- SESSION_SECRET (auto-generated)');
console.log('- NODE_ENV=development');
console.log('- PORT=5000');
console.log('\nReplace DATABASE_URL before running database migrations. Never commit .env.');
