import { requireAdmin } from "@/lib/admin-auth";
import { deleteOutlet, updateOutlet } from "@/lib/outlet-store";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  const { id } = req.query;

  if (req.method === "PUT") {
    const outlet = await updateOutlet(id, req.body);

    if (!outlet) {
      return res.status(404).json({ error: "Outlet not found." });
    }

    return res.status(200).json({ outlet });
  }

  if (req.method === "DELETE") {
    const removed = await deleteOutlet(id);

    if (!removed) {
      return res.status(404).json({ error: "Outlet not found." });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
