import { clearAdminCookies } from "@/lib/admin-auth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  res.setHeader("Set-Cookie", clearAdminCookies());
  return res.status(200).json({ ok: true });
}
