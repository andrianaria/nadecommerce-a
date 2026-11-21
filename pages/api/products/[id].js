import { deleteProduct, updateProduct } from "@/lib/product-store";
import { requireAdmin } from "@/lib/admin-auth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb"
    }
  }
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    if (!(await requireAdmin(req, res))) {
      return;
    }

    try {
      const product = await updateProduct(id, req.body);
      return res.status(200).json({ product });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    if (!(await requireAdmin(req, res))) {
      return;
    }

    try {
      await deleteProduct(id);
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
