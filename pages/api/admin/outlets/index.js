import { requireAdmin } from "@/lib/admin-auth";
import { createOutlet, listOutlets } from "@/lib/outlet-store";

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);

  if (!admin) {
    return;
  }

  if (req.method === "GET") {
    const outlets = await listOutlets();
    return res.status(200).json({ outlets });
  }

  if (req.method === "POST") {
    const outlet = await createOutlet(req.body);
    return res.status(200).json({ outlet });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
