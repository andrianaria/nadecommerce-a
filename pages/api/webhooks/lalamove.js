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

  const reference =
    req.body.metadata?.orderReference || req.body.data?.metadata?.orderReference;

  if (reference) {
    const existing = await findOrderByReference(reference);
    const currentMetadata =
      existing && typeof existing.metadata === "object" && existing.metadata
        ? existing.metadata
        : {};
    const currentLalamove =
      currentMetadata.lalamove && typeof currentMetadata.lalamove === "object"
        ? currentMetadata.lalamove
        : {};
    const driver = extractDriverInfo(req.body);

    await updateOrderByReference(reference, {
      deliveryStatus: req.body.status || req.body.data?.status || "updated",
      deliveryProvider: "lalamove",
      deliveryReference: req.body.orderId || req.body.data?.orderId || null,
      metadata: {
        ...currentMetadata,
        lalamove: {
          ...currentLalamove,
          ...(driver ? { driver } : {}),
          webhook: req.body
        }
      }
    });
  }

  return res.status(200).json({ ok: true });
}
