import { getAdminSession } from "@/lib/admin-auth";
import { getLalamoveOrder } from "@/lib/lalamove";
import { findOrderByReference, updateOrderByReference } from "@/lib/order-store";

function extractDriverInfo(payload = {}) {
  const source = payload?.data || payload;
  const driver =
    source?.driver ||
    source?.driverDetails ||
    source?.fleet?.driver ||
    source?.order?.driver ||
    null;
  const vehicle =
    source?.vehicle ||
    source?.driverVehicle ||
    source?.fleet?.vehicle ||
    source?.order?.vehicle ||
    null;

  const driverName =
    driver?.name ||
    driver?.driverName ||
    source?.driverName ||
    source?.courierName ||
    null;
  const driverPhone =
    driver?.phone ||
    driver?.phoneNumber ||
    source?.driverPhone ||
    source?.courierPhone ||
    null;
  const plateNumber =
    vehicle?.plateNumber ||
    vehicle?.plate ||
    source?.plateNumber ||
    source?.vehiclePlate ||
    null;

  if (!driverName && !driverPhone && !plateNumber) {
    return null;
  }

  return {
    name: driverName || null,
    phone: driverPhone || null,
    plateNumber: plateNumber || null
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const session = await getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const reference = String(req.body?.reference || "").trim();
  if (!reference) {
    return res.status(400).json({ error: "Referensi transaksi wajib diisi." });
  }

  const order = await findOrderByReference(reference);
  if (!order) {
    return res.status(404).json({ error: "Transaksi tidak ditemukan." });
  }

  const orderId = order.deliveryReference || order.metadata?.lalamove?.order?.data?.orderId || order.metadata?.lalamove?.order?.orderId;
  if (!orderId) {
    return res.status(400).json({ error: "Order ID Lalamove belum tersedia." });
  }

  try {
    const lalamoveOrder = await getLalamoveOrder(orderId);
    const source = lalamoveOrder?.data || lalamoveOrder || {};
    const driver = extractDriverInfo(lalamoveOrder);
    const currentMetadata =
      order && typeof order.metadata === "object" && order.metadata ? order.metadata : {};
    const currentLalamove =
      currentMetadata.lalamove && typeof currentMetadata.lalamove === "object"
        ? currentMetadata.lalamove
        : {};

    const nextMetadata = {
      ...currentMetadata,
      lalamove: {
        ...currentLalamove,
        ...(driver ? { driver } : {}),
        order: lalamoveOrder,
        lastManualSyncAt: new Date().toISOString()
      }
    };

    const updated = await updateOrderByReference(reference, {
      deliveryStatus: source?.status || order.deliveryStatus || "pending",
      deliveryProvider: "lalamove",
      deliveryReference: source?.orderId || orderId,
      metadata: nextMetadata
    });

    return res.status(200).json({
      ok: true,
      order: updated,
      deliveryStatus: updated?.deliveryStatus || source?.status || "pending"
    });
  } catch (error) {
    return res.status(400).json({
      error: error?.message || "Gagal sinkron status Lalamove."
    });
  }
}
