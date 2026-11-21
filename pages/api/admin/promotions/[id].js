import { requireAdmin } from "@/lib/admin-auth";
import {
  deletePromotion,
  findPromotionById,
  updatePromotion
} from "@/lib/promotion-store";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  const { id } = req.query;

  if (req.method === "GET") {
    const promotion = await findPromotionById(String(id));
    if (!promotion) {
      return res.status(404).json({ error: "Promosi tidak ditemukan." });
    }
    return res.status(200).json({ promotion });
  }

  if (req.method === "PUT") {
    try {
      const promotion = await updatePromotion(String(id), req.body || {});
      return res.status(200).json({ promotion });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await deletePromotion(String(id));
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
