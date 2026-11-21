import { requireAdmin } from "@/lib/admin-auth";
import { listMemberAccounts, reconnectFailedMembers } from "@/lib/member-auth";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    const members = await listMemberAccounts();
    return res.status(200).json({ members });
  }

  if (req.method === "POST") {
    const action = String(req.body?.action || "").trim();

    if (action === "reconnect_failed") {
      const results = await reconnectFailedMembers();
      return res.status(200).json({ results });
    }

    return res.status(400).json({ error: "Aksi tidak dikenali." });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
