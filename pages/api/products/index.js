import { createProduct, getProducts } from "@/lib/product-store";
import { requireAdmin } from "@/lib/admin-auth";
import { getActiveDataMode } from "@/lib/store-config";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb"
    }
  }
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const products = await getProducts();
    return res.status(200).json({ products, mode: getActiveDataMode() });
  }

  if (req.method === "POST") {
    if (!(await requireAdmin(req, res))) {
      return;
    }

    try {
      const product = await createProduct(req.body);
      return res.status(201).json({ product });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
