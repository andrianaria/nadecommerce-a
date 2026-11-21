import { requireAdmin } from "@/lib/admin-auth";
import { updateOrderByReference } from "@/lib/order-store";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const { reference } = req.query;

  if (req.method === "PUT") {
    const order = await updateOrderByReference(reference, req.body);

    if (!order) {
      return res.status(404).json({ error: "Transaction not found." });
    }

    return res.status(200).json({ order });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
