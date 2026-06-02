import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const requiredKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ADMIN_PASSWORD'];

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
const env = { ...fileEnv, ...process.env };
const missing = requiredKeys.filter(key => !env[key]);

if (missing.length > 0) {
  console.error(`Missing required .env values: ${missing.join(', ')}`);
  process.exit(1);
}

const config = {
  SUPABASE_URL: env.SUPABASE_URL,
  SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
  ADMIN_PASSWORD: env.ADMIN_PASSWORD,
};

writeFileSync(
  'js/env.js',
  `window.APP_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
);

console.log('Generated js/env.js from .env');
