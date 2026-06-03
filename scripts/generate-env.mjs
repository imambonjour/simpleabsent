import { existsSync, readFileSync, writeFileSync } from 'node:fs';

function parseEnv(text) {
  return text.split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return env;

    const separator = trimmed.indexOf('=');
    if (separator === -1) return env;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
    return env;
  }, {});
}

const fileEnv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
// On Vercel, process.env contains all environment variables from dashboard
const env = { ...fileEnv, ...process.env };

const config = {
  SUPABASE_URL: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ADMIN_PASSWORD: env.ADMIN_PASSWORD,
};

const missing = [
  !config.SUPABASE_URL && 'SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL',
  !config.SUPABASE_ANON_KEY && 'SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
].filter(Boolean);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Make sure you have set these in Vercel Dashboard > Settings > Environment Variables');
  process.exit(1);
}

writeFileSync('js/env.js', `window.APP_CONFIG = ${JSON.stringify(config, null, 2)};\n`);

console.log('Generated js/env.js from .env');
