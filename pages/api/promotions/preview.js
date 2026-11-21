import { getMemberSession } from "@/lib/member-auth";
import { getProducts } from "@/lib/product-store";
import { previewPromotionApplication } from "@/lib/promotion-store";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const session = await getMemberSession(req);
    const products = await getProducts();
    const result = await previewPromotionApplication({
      cartLines: req.body?.items || [],
      outletSlug: req.body?.outletSlug || "",
      code: req.body?.code || "",
      member: session?.member || null,
      products,
      language: req.body?.language || "id"
    });

    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(400)
      .json({ error: error.message || (req.body?.language === "en" ? "Promotion is invalid." : "Promo tidak valid.") });
  }
}
