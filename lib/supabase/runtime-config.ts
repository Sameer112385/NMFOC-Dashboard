import { mkdir, readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';

export type SupabaseRuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string | null;
  savedAt: string;
};

type SavedSupabaseRuntimeConfig = Partial<SupabaseRuntimeConfig>;

const configDir = path.join(process.cwd(), '.local-db');
const configFile = path.join(configDir, 'supabase-config.json');

function fromEnv(): SupabaseRuntimeConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey: supabaseServiceRoleKey || null,
    savedAt: new Date().toISOString(),
  };
}

let cachedConfig: SupabaseRuntimeConfig | null = null;
let hasAttemptedRead = false;

async function readSavedConfig(): Promise<SupabaseRuntimeConfig | null> {
  if (hasAttemptedRead) {
    return cachedConfig;
  }
  try {
    const raw = await readFile(configFile, 'utf8');
    const parsed = JSON.parse(raw) as SavedSupabaseRuntimeConfig;
    hasAttemptedRead = true;
    if (!parsed.supabaseUrl || !parsed.supabaseAnonKey) {
      cachedConfig = null;
      return null;
    }
    cachedConfig = {
      supabaseUrl: String(parsed.supabaseUrl).trim(),
      supabaseAnonKey: String(parsed.supabaseAnonKey).trim(),
      supabaseServiceRoleKey: parsed.supabaseServiceRoleKey ? String(parsed.supabaseServiceRoleKey).trim() : null,
      savedAt: parsed.savedAt ? String(parsed.savedAt) : new Date().toISOString(),
    };
    return cachedConfig;
  } catch {
    hasAttemptedRead = true;
    cachedConfig = null;
    return null;
  }
}

export async function getSupabaseRuntimeConfig(): Promise<SupabaseRuntimeConfig | null> {
  return fromEnv() ?? readSavedConfig();
}

export async function hasSupabaseRuntimeConfig(): Promise<boolean> {
  const config = await getSupabaseRuntimeConfig();
  return Boolean(config?.supabaseUrl && config?.supabaseAnonKey);
}

export async function saveSupabaseRuntimeConfig(input: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string | null;
}) {
  const config: SupabaseRuntimeConfig = {
    supabaseUrl: input.supabaseUrl.trim(),
    supabaseAnonKey: input.supabaseAnonKey.trim(),
    supabaseServiceRoleKey: input.supabaseServiceRoleKey?.trim() || null,
    savedAt: new Date().toISOString(),
  };
  cachedConfig = config;
  hasAttemptedRead = true;
  await mkdir(configDir, { recursive: true });
  await writeFile(configFile, JSON.stringify(config, null, 2), 'utf8');
  return config;
}

export async function clearSupabaseRuntimeConfig() {
  cachedConfig = null;
  hasAttemptedRead = false;
  try {
    await unlink(configFile);
  } catch {
    // ignore
  }
}
