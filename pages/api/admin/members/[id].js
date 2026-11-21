import { requireAdmin } from "@/lib/admin-auth";
import { reconnectMemberToFranchisee } from "@/lib/member-auth";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === "POST") {
    try {
      const member = await reconnectMemberToFranchisee(req.query.id);
      return res.status(200).json({ member });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Reconnect gagal." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
