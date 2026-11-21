import { requireAdmin } from "@/lib/admin-auth";
import { saveProductMediaUpload } from "@/lib/product-media";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb"
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    const asset = await saveProductMediaUpload({
      dataUrl: req.body.dataUrl,
      kind: req.body.kind
    });

    return res.status(200).json({ asset });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
