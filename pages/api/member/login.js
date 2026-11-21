import { createMemberCookies, signInMember } from "@/lib/member-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const identifier = req.body?.identifier || req.body?.email || req.body?.phone || "";
    const member = await signInMember(
      identifier,
      req.body?.password || "",
      req.body?.language || "id"
    );
    res.setHeader("Set-Cookie", createMemberCookies(member));
    return res.status(200).json({ member });
  } catch (error) {
    return res.status(400).json({
      error: error.message || (req.body?.language === "en" ? "Login failed." : "Gagal masuk.")
    });
  }
}
