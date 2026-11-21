const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

function buildUrl(pathname, query) {
  const url = new URL(`/rest/v1/${pathname}`, supabaseUrl);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export async function supabaseRequest(pathname, options = {}) {
  const { method = "GET", body, query, headers = {} } = options;

  const response = await fetch(buildUrl(pathname, query), {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed: ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
