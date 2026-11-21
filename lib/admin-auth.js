import crypto from "crypto";
import bcrypt from "bcryptjs";
import { hasMySqlEnv } from "@/lib/store-config";
import { mysqlQuery } from "@/lib/mysql";
import { supabaseRequest } from "@/lib/supabase-rest";

const accessCookieName = "street_sushi_admin_access_token";
const refreshCookieName = "street_sushi_admin_refresh_token";
const mysqlSessionCookieName = "street_sushi_admin_session";
const oneWeek = 60 * 60 * 24 * 7;

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (!key) {
      return cookies;
    }

    cookies[key] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

function buildCookie(name, value, maxAge) {
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(
    value
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`;
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function signSession(payload) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is missing.");
  }

  const json = JSON.stringify(payload);
  const body = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifySession(value) {
  const secret = getSessionSecret();
  if (!secret) return null;

  const [body, sig] = String(value || "").split(".");
  if (!body || !sig) return null;

  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

async function fetchSupabaseUser(accessToken) {
  const response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
    headers: {
      apikey: getSupabasePublicKey(),
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchAdminProfile(userId) {
  if (hasMySqlEnv()) {
    const rows = await mysqlQuery(
      "select id,email,full_name,role,is_active from admin_users where id = ? limit 1",
      [userId]
    );
    return rows?.[0] || null;
  }

  const rows = await supabaseRequest("admin_profiles", {
    query: {
      id: `eq.${userId}`,
      select: "id,email,full_name,role,is_active"
    }
  });

  return rows?.[0] || null;
}

export async function signInAdmin(email, password) {
  if (hasMySqlEnv()) {
    const rows = await mysqlQuery(
      "select id,email,full_name,role,is_active,password_hash from admin_users where email = ? limit 1",
      [String(email || "").trim().toLowerCase()]
    );

    const admin = rows?.[0] || null;
    if (!admin?.is_active) {
      throw new Error("This user is not allowed to access the admin page.");
    }

    const ok = await bcrypt.compare(String(password || ""), admin.password_hash || "");
    if (!ok) {
      throw new Error("Invalid email or password.");
    }

    const session = {
      adminId: admin.id,
      exp: Math.floor(Date.now() / 1000) + oneWeek
    };

    return {
      session,
      user: { id: admin.id, email: admin.email },
      adminProfile: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        is_active: admin.is_active
      }
    };
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Auth configuration is missing.");
  }

  let response;

  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });
  } catch (error) {
    const cause = error?.cause;
    const extra =
      cause?.code || cause?.errno || cause?.message || error?.message || "fetch failed";
    throw new Error(`Auth request failed: ${extra}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${errorText}`);
  }

  const session = await response.json();
  const user = await fetchSupabaseUser(session.access_token);

  if (!user) {
    throw new Error("Could not verify user.");
  }

  const adminProfile = await fetchAdminProfile(user.id);

  if (!adminProfile?.is_active) {
    throw new Error("This user is not allowed to access the admin page.");
  }

  return {
    session,
    user,
    adminProfile
  };
}

export function createAdminCookies(session) {
  if (hasMySqlEnv()) {
    const token = signSession(session);
    return [buildCookie(mysqlSessionCookieName, token, oneWeek)];
  }

  return [
    buildCookie(accessCookieName, session.access_token, session.expires_in || oneWeek),
    buildCookie(refreshCookieName, session.refresh_token || "", oneWeek)
  ];
}

export function clearAdminCookies() {
  if (hasMySqlEnv()) {
    return [buildCookie(mysqlSessionCookieName, "", 0)];
  }

  return [
    buildCookie(accessCookieName, "", 0),
    buildCookie(refreshCookieName, "", 0)
  ];
}

export async function getAdminSession(req) {
  if (hasMySqlEnv()) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[mysqlSessionCookieName];
    const session = verifySession(token);
    if (!session?.adminId) return null;
    if (session.exp && session.exp < Math.floor(Date.now() / 1000)) return null;

    const adminProfile = await fetchAdminProfile(session.adminId);
    if (!adminProfile?.is_active) return null;

    return {
      user: { id: adminProfile.id, email: adminProfile.email },
      adminProfile,
      accessToken: token
    };
  }

  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies[accessCookieName];

  if (!accessToken) {
    return null;
  }

  const user = await fetchSupabaseUser(accessToken);

  if (!user) {
    return null;
  }

  const adminProfile = await fetchAdminProfile(user.id);

  if (!adminProfile?.is_active) {
    return null;
  }

  return {
    user,
    adminProfile,
    accessToken
  };
}

export async function isAdminRequest(req) {
  const session = await getAdminSession(req);
  return Boolean(session);
}

export async function requireAdmin(req, res) {
  const session = await getAdminSession(req);

  if (session) {
    return session;
  }

  res.status(401).json({ error: "Admin login required." });
  return null;
}
