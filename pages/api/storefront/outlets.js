import { listOutlets } from "@/lib/outlet-store";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const outlets = await listOutlets();
  return res.status(200).json({
    outlets: outlets.filter((outlet) => outlet.isActive !== false)
  });
}
