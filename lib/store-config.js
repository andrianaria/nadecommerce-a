export function hasSupabaseServerEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  );
}

export function hasMySqlEnv() {
  return Boolean(
    process.env.MYSQL_HOST &&
      process.env.MYSQL_USER &&
      (process.env.MYSQL_PASSWORD || process.env.MYSQL_PASSWORD === "") &&
      process.env.MYSQL_DATABASE
  );
}

export function getActiveDataMode() {
  if (hasMySqlEnv()) return "mysql";
  if (hasSupabaseServerEnv()) return "supabase";
  return "local";
}

export function getPublicAppUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
