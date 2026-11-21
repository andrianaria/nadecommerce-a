import { clearMemberCookies } from "@/lib/member-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  res.setHeader("Set-Cookie", clearMemberCookies());
  return res.status(200).json({ ok: true });
}
