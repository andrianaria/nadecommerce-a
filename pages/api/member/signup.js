import { createMemberCookies, signUpMember } from "@/lib/member-auth";

function getAppUrl(req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]
      : process.env.NODE_ENV === "production"
        ? "https"
        : "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3001";
  return process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const member = await signUpMember({
      ...(req.body || {}),
      appUrl: getAppUrl(req)
    });
    res.setHeader("Set-Cookie", createMemberCookies(member));
    return res.status(200).json({ member });
  } catch (error) {
    return res.status(400).json({
      error:
        error.message ||
        (req.body?.language === "en" ? "Failed to create member account." : "Gagal membuat akun member.")
    });
  }
}
