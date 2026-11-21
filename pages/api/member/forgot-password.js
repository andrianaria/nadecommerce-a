import { requestMemberPasswordReset } from "@/lib/member-auth";

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
    const language = req.body?.language || "id";
    await requestMemberPasswordReset(req.body?.email || "", getAppUrl(req), language);
    return res.status(200).json({
      ok: true,
      message:
        language === "en"
          ? "If the email is registered, we've sent a password reset link to your inbox."
          : "Kalau email terdaftar, kami sudah kirim link reset password ke inbox kamu."
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Gagal mengirim link reset password."
    });
  }
}
