import { requireAdmin } from "@/lib/admin-auth";
import { createProductCategory, listProductCategories } from "@/lib/category-store";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  if (req.method === "GET") {
    const categories = await listProductCategories();
    return res.status(200).json({ categories });
  }

  if (req.method === "POST") {
    try {
      const category = await createProductCategory(req.body);
      return res.status(201).json({ category });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
