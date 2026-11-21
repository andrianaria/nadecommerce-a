import crypto from "crypto";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { hasMySqlEnv } from "@/lib/store-config";

const memberSessionCookieName = "street_sushi_member_session";
const oneMonth = 60 * 60 * 24 * 30;
const memberAuthMessages = {
  id: {
    resetEmailMissing: "Reset password email belum dikonfigurasi.",
    welcomeEmailSubject: "Selamat datang di Street Sushi Member",
    welcomeGreeting: "Halo",
    welcomeIntro:
      "Akun member Street Sushi kamu sudah aktif. Sekarang checkout bisa lebih cepat dan praktis.",
    welcomeHighlightsTitle: "Yang bisa kamu nikmati sebagai member:",
    welcomeHighlightOne: "Riwayat pesanan dan lacak status pesanan",
    welcomeHighlightTwo: "Checkout lebih cepat tanpa isi ulang dari awal",
    welcomeHighlightThree: "Info promo dan penawaran spesial",
    welcomeCta: "Mulai belanja",
    resetEmailSubject: "Reset password member Street Sushi",
    resetGreeting: "Halo",
    resetIntro: "Kami menerima permintaan untuk reset password akun member kamu.",
    resetCta: "Reset password",
    resetManual: "Atau buka link ini secara manual:",
    resetExpiry:
      "Link ini berlaku 30 menit. Kalau kamu tidak merasa meminta reset password, abaikan email ini.",
    fullNameRequired: "Nama lengkap wajib diisi.",
    phoneRequired: "Nomor WhatsApp wajib diisi.",
    emailExists: "Email ini sudah terdaftar.",
    phoneExists: "Nomor WhatsApp ini sudah terdaftar.",
    googleExists: "Akun Google ini sudah terhubung.",
    googleLoginMissing: "Google login belum dikonfigurasi.",
    googleTokenInvalid: "Google token tidak valid.",
    googleClientMismatch: "Google client tidak cocok.",
    googleEmailUnverified: "Email Google belum terverifikasi.",
    mysqlOnly: "Mode member login saat ini hanya tersedia untuk MySQL.",
    passwordMin: "Password minimal 6 karakter.",
    accountMissing: "Akun member tidak ditemukan atau tidak aktif.",
    googleOnly: "Akun ini terdaftar lewat Google. Silakan masuk dengan Google.",
    invalidCredentials: "Email/nomor telepon atau password salah.",
    accountInactive: "Akun member tidak aktif.",
    emailRequired: "Email wajib diisi.",
    tokenMissing: "Token reset password tidak ditemukan.",
    resetInvalid: "Link reset password tidak valid atau sudah tidak aktif.",
    resetInvalidShort: "Link reset password tidak valid.",
    resetExpired: "Link reset password sudah kedaluwarsa. Silakan minta link baru."
  },
  en: {
    resetEmailMissing: "Password reset email is not configured yet.",
    welcomeEmailSubject: "Welcome to Street Sushi Member",
    welcomeGreeting: "Hi",
    welcomeIntro:
      "Your Street Sushi member account is now active. Checkout will be faster and easier from now on.",
    welcomeHighlightsTitle: "What you can enjoy as a member:",
    welcomeHighlightOne: "Order history and order tracking",
    welcomeHighlightTwo: "Faster checkout without re-entering everything",
    welcomeHighlightThree: "Promo updates and special offers",
    welcomeCta: "Start shopping",
    resetEmailSubject: "Street Sushi member password reset",
    resetGreeting: "Hi",
    resetIntro: "We received a request to reset your member account password.",
    resetCta: "Reset password",
    resetManual: "Or open this link manually:",
    resetExpiry:
      "This link is valid for 30 minutes. If you did not request a password reset, please ignore this email.",
    fullNameRequired: "Full name is required.",
    phoneRequired: "WhatsApp number is required.",
    emailExists: "This email is already registered.",
    phoneExists: "This WhatsApp number is already registered.",
    googleExists: "This Google account is already linked.",
    googleLoginMissing: "Google login is not configured yet.",
    googleTokenInvalid: "The Google token is invalid.",
    googleClientMismatch: "The Google client does not match.",
    googleEmailUnverified: "The Google email address is not verified.",
    mysqlOnly: "Member login is currently available only with MySQL.",
    passwordMin: "Password must be at least 6 characters.",
    accountMissing: "Member account was not found or is inactive.",
    googleOnly: "This account was registered through Google. Please sign in with Google.",
    invalidCredentials: "The email/phone number or password is incorrect.",
    accountInactive: "This member account is inactive.",
    emailRequired: "Email is required.",
    tokenMissing: "The password reset token was not found.",
    resetInvalid: "The password reset link is invalid or no longer active.",
    resetInvalidShort: "The password reset link is invalid.",
    resetExpired: "The password reset link has expired. Please request a new one."
  }
};

function normalizeLanguage(language) {
  return language === "en" ? "en" : "id";
}

function authText(language, key) {
  const lang = normalizeLanguage(language);
  return memberAuthMessages[lang][key] || memberAuthMessages.id[key] || key;
}

function parseMaybeJson(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value === "string") {
    if (!value.trim()) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  if (typeof value === "object") return value;
  return fallback;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [key, ...valueParts] = cookie.trim().split("=");
    if (!key) return cookies;
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
  return process.env.MEMBER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "";
}

function signSession(payload) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("MEMBER_SESSION_SECRET is missing.");
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

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email || null;
}

function normalizePhone(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function hashToken(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

async function sendMemberResetEmail({ to, resetUrl, fullName, language = "id" }) {
  if (!hasResendConfig()) {
    throw new Error(authText(language, "resetEmailMissing"));
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: authText(language, "resetEmailSubject"),
      text: [
        `${authText(language, "resetGreeting")} ${fullName || "Member Street Sushi"},`,
        "",
        authText(language, "resetIntro"),
        `Buka link berikut untuk membuat password baru: ${resetUrl}`,
        "",
        authText(language, "resetExpiry"),
        "",
        "Street Sushi"
      ].join("\n"),
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #1f1a17; line-height: 1.6;">
          <p>${authText(language, "resetGreeting")} ${fullName || "Member Street Sushi"},</p>
          <p>${authText(language, "resetIntro")}</p>
          <p>
            <a
              href="${resetUrl}"
              style="display:inline-block;padding:12px 18px;border-radius:999px;background:#dd235f;color:#ffffff;text-decoration:none;font-weight:700;"
            >
              ${authText(language, "resetCta")}
            </a>
          </p>
          <p>${authText(language, "resetManual")}<br /><a href="${resetUrl}">${resetUrl}</a></p>
          <p>${authText(language, "resetExpiry")}</p>
          <p>Street Sushi</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    throw new Error(`Resend reset email failed: ${await response.text()}`);
  }

  return response.json();
}

async function sendMemberWelcomeEmail({ to, fullName, appUrl, language = "id" }) {
  if (!hasResendConfig() || !to) {
    return { skipped: true, reason: "missing_resend_config" };
  }

  const storefrontUrl = String(appUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");
  const productUrl = `${storefrontUrl}/produk`;
  const greetingName = fullName || "Member Street Sushi";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: authText(language, "welcomeEmailSubject"),
      text: [
        `${authText(language, "welcomeGreeting")} ${greetingName},`,
        "",
        authText(language, "welcomeIntro"),
        "",
        authText(language, "welcomeHighlightsTitle"),
        `- ${authText(language, "welcomeHighlightOne")}`,
        `- ${authText(language, "welcomeHighlightTwo")}`,
        `- ${authText(language, "welcomeHighlightThree")}`,
        "",
        `${authText(language, "welcomeCta")}: ${productUrl}`,
        "",
        "Street Sushi"
      ].join("\n"),
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #1f1a17; line-height: 1.6;">
          <p>${authText(language, "welcomeGreeting")} ${greetingName},</p>
          <p>${authText(language, "welcomeIntro")}</p>
          <div style="padding: 16px; border: 1px solid #ece7df; border-radius: 14px; background: #fffaf5;">
            <p style="margin:0 0 10px; font-weight:700;">${authText(language, "welcomeHighlightsTitle")}</p>
            <ul style="margin:0; padding-left:18px;">
              <li>${authText(language, "welcomeHighlightOne")}</li>
              <li>${authText(language, "welcomeHighlightTwo")}</li>
              <li>${authText(language, "welcomeHighlightThree")}</li>
            </ul>
          </div>
          <p style="margin-top:20px;">
            <a
              href="${productUrl}"
              style="display:inline-block;padding:12px 18px;border-radius:999px;background:#dd235f;color:#ffffff;text-decoration:none;font-weight:700;"
            >
              ${authText(language, "welcomeCta")}
            </a>
          </p>
          <p>Street Sushi</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    throw new Error(`Resend welcome email failed: ${await response.text()}`);
  }

  return response.json();
}

function getFranchiseSchema() {
  return process.env.FRANCHISEE_SCHEMA || "ssushi_franchisee";
}

function getFranchiseBrandId() {
  return Number(process.env.FRANCHISEE_BRAND_ID || 1);
}

function isFranchiseAccessError(error) {
  const code = String(error?.code || "");
  return [
    "ER_TABLEACCESS_DENIED_ERROR",
    "ER_DBACCESS_DENIED_ERROR",
    "ER_NO_SUCH_TABLE"
  ].includes(code);
}

function mapMemberRow(row) {
  if (!row) return null;
  const metadata = parseMaybeJson(row.metadata, {});

  return {
    id: row.id,
    franchiseCustomerId: row.franchise_customer_id || null,
    brandId: row.brand_id || null,
    fullName: row.full_name || "",
    email: row.email || "",
    phone: row.phone || "",
    googleSub: row.google_sub || null,
    authProvider: row.auth_provider || "credentials",
    isActive: Boolean(row.is_active),
    metadata,
    lastLoginAt: row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

async function findMemberByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const rows = await mysqlQuery(
    "select * from member_accounts where email = ? limit 1",
    [normalized]
  );
  return rows?.[0] || null;
}

async function findMemberByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const rows = await mysqlQuery(
    "select * from member_accounts where phone = ? limit 1",
    [normalized]
  );
  return rows?.[0] || null;
}

async function findMemberByGoogleSub(googleSub) {
  const sub = String(googleSub || "").trim();
  if (!sub) return null;
  const rows = await mysqlQuery(
    "select * from member_accounts where google_sub = ? limit 1",
    [sub]
  );
  return rows?.[0] || null;
}

async function findMemberById(id) {
  const rows = await mysqlQuery("select * from member_accounts where id = ? limit 1", [id]);
  return rows?.[0] || null;
}

async function findMemberByResetTokenHash(tokenHash) {
  const rows = await mysqlQuery(
    `select * from member_accounts
      where json_unquote(json_extract(metadata, '$.passwordReset.tokenHash')) = ?
      limit 1`,
    [tokenHash]
  );
  return rows?.[0] || null;
}

async function ensureFranchiseCustomerLink({ fullName, phone }) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { franchiseCustomerId: null, linked: false, reason: "missing_phone" };
  }

  const schema = getFranchiseSchema();
  const brandId = getFranchiseBrandId();

  try {
    const rows = await mysqlQuery(
      `select id, brand_id, name, phone, is_deleted
         from \`${schema}\`.customer
        where brand_id = ? and phone = ? and is_deleted = 0
        limit 1`,
      [brandId, normalizedPhone]
    );

    if (rows?.[0]) {
      return {
        franchiseCustomerId: Number(rows[0].id),
        brandId,
        linked: true
      };
    }

    const result = await mysqlExecute(
      `insert into \`${schema}\`.customer (brand_id, name, phone, is_deleted)
       values (?, ?, ?, 0)`,
      [brandId, String(fullName || "").trim(), normalizedPhone]
    );

    return {
      franchiseCustomerId: Number(result.insertId || 0) || null,
      brandId,
      linked: Boolean(result.insertId)
    };
  } catch (error) {
    if (isFranchiseAccessError(error)) {
      return {
        franchiseCustomerId: null,
        brandId,
        linked: false,
        reason: "access_denied"
      };
    }
    throw error;
  }
}

async function touchLastLogin(id) {
  await mysqlExecute(
    "update member_accounts set last_login_at = now(), updated_at = now() where id = ?",
    [id]
  );
}

async function updateMemberFranchiseLink(memberId, franchise) {
  await mysqlExecute(
    `update member_accounts
        set franchise_customer_id = ?,
            brand_id = ?,
            metadata = ?,
            updated_at = now()
      where id = ?`,
    [
      franchise.franchiseCustomerId,
      franchise.brandId || getFranchiseBrandId(),
      JSON.stringify({
        franchiseLinked: franchise.linked,
        franchiseReason: franchise.reason || null
      }),
      memberId
    ]
  );
}

async function createMemberAccount({
  fullName,
  email,
  phone,
  password,
  googleSub = null,
  authProvider = "credentials",
  language = "id"
}) {
  const normalizedName = String(fullName || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedName) {
    throw new Error(authText(language, "fullNameRequired"));
  }
  if (!normalizedPhone && authProvider === "credentials") {
    throw new Error(authText(language, "phoneRequired"));
  }

  if (normalizedEmail) {
    const existingEmail = await findMemberByEmail(normalizedEmail);
    if (existingEmail) {
      throw new Error(authText(language, "emailExists"));
    }
  }

  if (normalizedPhone) {
    const existingPhone = await findMemberByPhone(normalizedPhone);
    if (existingPhone) {
      throw new Error(authText(language, "phoneExists"));
    }
  }

  if (googleSub) {
    const existingGoogle = await findMemberByGoogleSub(googleSub);
    if (existingGoogle) {
      throw new Error(authText(language, "googleExists"));
    }
  }

  const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;
  const franchise = normalizedPhone
    ? await ensureFranchiseCustomerLink({
        fullName: normalizedName,
        phone: normalizedPhone
      })
    : { franchiseCustomerId: null, brandId: getFranchiseBrandId(), linked: false, reason: "missing_phone" };

  const id = randomUUID();

  await mysqlExecute(
    `insert into member_accounts
      (id, franchise_customer_id, brand_id, full_name, email, phone, password_hash, google_sub, auth_provider, is_active, metadata, last_login_at, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, now(), now(), now())`,
    [
      id,
      franchise.franchiseCustomerId,
      franchise.brandId || getFranchiseBrandId(),
      normalizedName,
      normalizedEmail,
      normalizedPhone || null,
      passwordHash,
      googleSub,
      authProvider,
      JSON.stringify({
        franchiseLinked: franchise.linked,
        franchiseReason: franchise.reason || null
      })
    ]
  );

  const created = await findMemberById(id);
  return mapMemberRow(created);
}

async function verifyGoogleIdToken(idToken, language = "id") {
  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    throw new Error(authText(language, "googleLoginMissing"));
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new Error(authText(language, "googleTokenInvalid"));
  }

  const payload = await response.json();

  if (payload.aud !== clientId) {
    throw new Error(authText(language, "googleClientMismatch"));
  }

  if (payload.email_verified !== "true") {
    throw new Error(authText(language, "googleEmailUnverified"));
  }

  return {
    googleSub: payload.sub,
    email: normalizeEmail(payload.email),
    fullName: payload.name || payload.given_name || "Member Street Sushi"
  };
}

export async function signUpMember({ fullName, email, phone, password, language = "id", appUrl = "" }) {
  if (!hasMySqlEnv()) {
    throw new Error(authText(language, "mysqlOnly"));
  }

  const rawPassword = String(password || "");
  if (rawPassword.length < 6) {
    throw new Error(authText(language, "passwordMin"));
  }

  const member = await createMemberAccount({
    fullName,
    email,
    phone,
    password: rawPassword,
    authProvider: "credentials",
    language
  });

  if (member?.email) {
    try {
      await sendMemberWelcomeEmail({
        to: member.email,
        fullName: member.fullName,
        appUrl,
        language
      });
    } catch (error) {
      console.error("Welcome email could not be sent.");
    }
  }

  return member;
}

export async function signInMember(identifier, password, language = "id") {
  if (!hasMySqlEnv()) {
    throw new Error(authText(language, "mysqlOnly"));
  }

  const rawIdentifier = String(identifier || "").trim();
  const rawPassword = String(password || "");

  const member =
    (rawIdentifier.includes("@")
      ? await findMemberByEmail(rawIdentifier)
      : await findMemberByPhone(rawIdentifier)) || null;

  if (!member?.is_active) {
    throw new Error(authText(language, "accountMissing"));
  }

  if (!member.password_hash) {
    throw new Error(authText(language, "googleOnly"));
  }

  const ok = await bcrypt.compare(rawPassword, member.password_hash);
  if (!ok) {
    throw new Error(authText(language, "invalidCredentials"));
  }

  await touchLastLogin(member.id);
  return mapMemberRow(member);
}

export async function signInMemberWithGoogle(idToken, language = "id") {
  if (!hasMySqlEnv()) {
    throw new Error(authText(language, "mysqlOnly"));
  }

  const googleProfile = await verifyGoogleIdToken(idToken, language);

  let member = await findMemberByGoogleSub(googleProfile.googleSub);

  if (!member && googleProfile.email) {
    member = await findMemberByEmail(googleProfile.email);
    if (member) {
      await mysqlExecute(
        `update member_accounts
            set google_sub = ?, auth_provider = ?, updated_at = now()
          where id = ?`,
        [googleProfile.googleSub, "google", member.id]
      );
      member = await findMemberById(member.id);
    }
  }

  if (!member) {
    member = await createMemberAccount({
      fullName: googleProfile.fullName,
      email: googleProfile.email,
      phone: "",
      googleSub: googleProfile.googleSub,
      authProvider: "google",
      language
    });
    return member;
  }

  if (!member.is_active) {
    throw new Error(authText(language, "accountInactive"));
  }

  await touchLastLogin(member.id);
  return mapMemberRow(member);
}

export async function listMemberAccounts() {
  if (!hasMySqlEnv()) {
    throw new Error("Mode member hanya tersedia untuk MySQL.");
  }

  const rows = await mysqlQuery(
    `select id, franchise_customer_id, brand_id, full_name, email, phone, google_sub, auth_provider, is_active, metadata, last_login_at, created_at, updated_at
       from member_accounts
      order by created_at desc`
  );

  return (rows || []).map(mapMemberRow);
}

export async function reconnectMemberToFranchisee(memberId) {
  if (!hasMySqlEnv()) {
    throw new Error("Mode member hanya tersedia untuk MySQL.");
  }

  const member = await findMemberById(memberId);
  if (!member) {
    throw new Error("Member tidak ditemukan.");
  }

  if (!member.phone) {
    throw new Error("Member ini belum punya nomor telepon untuk dikirim ke franchisee.");
  }

  const franchise = await ensureFranchiseCustomerLink({
    fullName: member.full_name,
    phone: member.phone
  });

  await updateMemberFranchiseLink(member.id, franchise);
  const next = await findMemberById(member.id);
  return mapMemberRow(next);
}

export async function reconnectFailedMembers() {
  const members = await listMemberAccounts();
  const failed = members.filter((member) => !member.metadata?.franchiseLinked);
  const results = [];

  for (const member of failed) {
    try {
      const next = await reconnectMemberToFranchisee(member.id);
      results.push({ ok: true, member: next });
    } catch (error) {
      results.push({
        ok: false,
        memberId: member.id,
        fullName: member.fullName,
        error: error.message || "Reconnect gagal."
      });
    }
  }

  return results;
}

export async function requestMemberPasswordReset(email, appUrl, language = "id") {
  if (!hasMySqlEnv()) {
    throw new Error(authText(language, "mysqlOnly"));
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error(authText(language, "emailRequired"));
  }

  const member = await findMemberByEmail(normalizedEmail);
  if (!member?.is_active || !member.email) {
    return { ok: true, sent: false };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const metadata = parseMaybeJson(member.metadata, {});
  metadata.passwordReset = {
    tokenHash: hashToken(token),
    expiresAt,
    requestedAt: new Date().toISOString()
  };

  await mysqlExecute(
    "update member_accounts set metadata = ?, updated_at = now() where id = ?",
    [JSON.stringify(metadata), member.id]
  );

  const origin = String(appUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");
  const resetUrl = `${origin}/member-reset-password?token=${encodeURIComponent(token)}`;
  await sendMemberResetEmail({
    to: member.email,
    resetUrl,
    fullName: member.full_name,
    language
  });

  return { ok: true, sent: true };
}

export async function resetMemberPassword(token, password, language = "id") {
  if (!hasMySqlEnv()) {
    throw new Error(authText(language, "mysqlOnly"));
  }

  const rawToken = String(token || "").trim();
  const rawPassword = String(password || "");

  if (!rawToken) {
    throw new Error(authText(language, "tokenMissing"));
  }
  if (rawPassword.length < 6) {
    throw new Error(authText(language, "passwordMin"));
  }

  const member = await findMemberByResetTokenHash(hashToken(rawToken));
  if (!member?.is_active) {
    throw new Error(authText(language, "resetInvalid"));
  }

  const metadata = parseMaybeJson(member.metadata, {});
  const passwordReset = metadata.passwordReset || null;

  if (!passwordReset?.tokenHash || passwordReset.tokenHash !== hashToken(rawToken)) {
    throw new Error(authText(language, "resetInvalidShort"));
  }

  if (!passwordReset.expiresAt || new Date(passwordReset.expiresAt).getTime() < Date.now()) {
    throw new Error(authText(language, "resetExpired"));
  }

  metadata.passwordReset = null;
  metadata.lastPasswordResetAt = new Date().toISOString();

  await mysqlExecute(
    `update member_accounts
        set password_hash = ?, metadata = ?, updated_at = now()
      where id = ?`,
    [await bcrypt.hash(rawPassword, 10), JSON.stringify(metadata), member.id]
  );

  const next = await findMemberById(member.id);
  return mapMemberRow(next);
}

export function createMemberCookies(member) {
  const session = {
    memberId: member.id,
    exp: Math.floor(Date.now() / 1000) + oneMonth
  };
  const token = signSession(session);
  return [buildCookie(memberSessionCookieName, token, oneMonth)];
}

export function clearMemberCookies() {
  return [buildCookie(memberSessionCookieName, "", 0)];
}

export async function getMemberSession(req) {
  if (!hasMySqlEnv()) return null;

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[memberSessionCookieName];
  const session = verifySession(token);

  if (!session?.memberId) return null;
  if (session.exp && session.exp < Math.floor(Date.now() / 1000)) return null;

  const member = await findMemberById(session.memberId);
  if (!member?.is_active) return null;

  return {
    member: mapMemberRow(member)
  };
}

export async function requireMember(req, res) {
  const session = await getMemberSession(req);
  if (session) return session;
  res.status(401).json({ error: "Member login required." });
  return null;
}
