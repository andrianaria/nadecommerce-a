import { createMemberCookies, signInMemberWithGoogle } from "@/lib/member-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const token = String(req.body?.credential || req.body?.idToken || "").trim();
    if (!token) {
      return res.status(400).json({
        error:
          req.body?.language === "en"
            ? "Google credential is required."
            : "Google credential wajib diisi."
      });
    }

    const member = await signInMemberWithGoogle(token, req.body?.language || "id");
    res.setHeader("Set-Cookie", createMemberCookies(member));
    return res.status(200).json({ member });
  } catch (error) {
    return res.status(400).json({
      error: error.message || (req.body?.language === "en" ? "Google login failed." : "Google login gagal.")
    });
  }
}
