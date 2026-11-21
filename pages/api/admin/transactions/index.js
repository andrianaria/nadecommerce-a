import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/order-store";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  if (req.method === "GET") {
    const orders = await listOrders();
    return res.status(200).json({ orders });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
