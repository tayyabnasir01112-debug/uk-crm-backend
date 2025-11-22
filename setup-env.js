// Script to generate session secret and create .env file
import crypto from 'crypto';
import fs from 'fs';

const sessionSecret = crypto.randomBytes(32).toString('hex');
// Your Neon connection string
const neonConnectionString = "postgresql://neondb_owner:npg_BNLK1khwEq0M@ep-broad-haze-ab8nmjmg-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const envContent = `# Database Configuration
DATABASE_URL=${neonConnectionString}

# Session Secret (auto-generated)
SESSION_SECRET=${sessionSecret}

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000
`;

fs.writeFileSync('.env', envContent);

console.log('✅ .env file created successfully!');
console.log('\n📋 Your Session Secret (save this for Render):');
console.log(sessionSecret);
console.log('\n💾 Your .env file has been created with:');
console.log('- DATABASE_URL (from Neon)');
console.log('- SESSION_SECRET (auto-generated)');
console.log('- NODE_ENV=development');
console.log('- PORT=5000');

