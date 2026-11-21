import { requireAdmin } from "@/lib/admin-auth";
import { hasMySqlEnv, hasSupabaseServerEnv } from "@/lib/store-config";
import { mysqlExecute } from "@/lib/mysql";
import { supabaseRequest } from "@/lib/supabase-rest";
import fs from "fs/promises";
import path from "path";

const confirmPhrase = "HAPUS SEMUA";

async function purgeMySql() {
  // Order is important due to FKs.
  await mysqlExecute("delete from payment_logs");
  await mysqlExecute("delete from payment_transactions");
  await mysqlExecute("delete from order_items");
  await mysqlExecute("delete from orders");
}

async function purgeSupabase() {
  // Order is important due to FKs.
  await supabaseRequest("payment_logs", { method: "DELETE", query: { id: "gt.0" }, headers: { Prefer: "return=minimal" } });
  await supabaseRequest("payment_transactions", { method: "DELETE", query: { id: "gt.0" }, headers: { Prefer: "return=minimal" } });
  await supabaseRequest("order_items", { method: "DELETE", query: { id: "gt.0" }, headers: { Prefer: "return=minimal" } });
  await supabaseRequest("orders", { method: "DELETE", query: { id: "gt.0" }, headers: { Prefer: "return=minimal" } });
}

async function purgeLocalJson() {
  const dataFile = path.join(process.cwd(), "data", "orders.json");
  await fs.writeFile(dataFile, "[]\n", "utf8");
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (process.env.ALLOW_ADMIN_PURGE !== "true") {
    return res.status(403).json({
      error: "Purge dinonaktifkan. Set ALLOW_ADMIN_PURGE=true untuk mengaktifkan fitur ini."
    });
  }

  const confirm = String(req.body?.confirm || "").trim().toUpperCase();
  if (confirm !== confirmPhrase) {
    return res.status(400).json({
      error: `Konfirmasi salah. Ketik persis: ${confirmPhrase}`
    });
  }

  try {
    if (hasMySqlEnv()) {
      await purgeMySql();
      return res.status(200).json({ ok: true, mode: "mysql" });
    }

    if (hasSupabaseServerEnv()) {
      await purgeSupabase();
      return res.status(200).json({ ok: true, mode: "supabase" });
    }

    await purgeLocalJson();
    return res.status(200).json({ ok: true, mode: "local" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

