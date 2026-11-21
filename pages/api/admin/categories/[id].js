import { requireAdmin } from "@/lib/admin-auth";
import { deleteProductCategory } from "@/lib/category-store";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const { id } = req.query;

  if (req.method === "DELETE") {
    try {
      await deleteProductCategory(id);
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
