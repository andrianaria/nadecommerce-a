import { requireAdmin } from "@/lib/admin-auth";
import { createPromotion, listPromotions } from "@/lib/promotion-store";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method === "GET") {
    const promotions = await listPromotions();
    return res.status(200).json({ promotions });
  }

  if (req.method === "POST") {
    try {
      const promotion = await createPromotion(req.body || {});
      return res.status(201).json({ promotion });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
