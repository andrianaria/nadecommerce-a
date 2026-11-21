const statusMap = {
  id: {
    pending: "Menunggu",
    confirmed: "Dikonfirmasi",
    paid: "Dibayar",
    processing: "Diproses",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    unpaid: "Belum bayar",
    failed: "Gagal",
    expired: "Kedaluwarsa",
    quoted: "Estimasi dibuat",
    booked: "Dipesan",
    assigning_driver: "Mencari kurir",
    on_going: "Dalam perjalanan",
    on_going_pickup: "Kurir menuju outlet",
    on_going_dropoff: "Kurir menuju alamat tujuan",
    picked_up: "Diambil kurir",
    delivered: "Terkirim"
  },
  en: {
    pending: "Pending",
    confirmed: "Confirmed",
    paid: "Paid",
    processing: "Preparing",
    completed: "Completed",
    cancelled: "Cancelled",
    unpaid: "Unpaid",
    failed: "Failed",
    expired: "Expired",
    quoted: "Quote ready",
    booked: "Booked",
    assigning_driver: "Finding courier",
    on_going: "On the way",
    on_going_pickup: "Courier heading to outlet",
    on_going_dropoff: "Courier heading to delivery address",
    picked_up: "Picked up",
    delivered: "Delivered"
  }
};

export function getOrderStatusLabel(status, language = "id") {
  const map = statusMap[language] || statusMap.id;
  return map[String(status || "").toLowerCase()] || status || "-";
}

export function getTrackingStage(order, language = "id") {
  const orderStatus = String(order?.status || "").toLowerCase();
  const paymentStatus = String(order?.paymentStatus || "").toLowerCase();
  const deliveryStatus = String(order?.deliveryStatus || "").toLowerCase();
  const copy = {
    id: {
      issueTitle: "Pesanan perlu perhatian",
      issueDesc: "Pesanan belum bisa lanjut karena pembayaran gagal, kedaluwarsa, atau dibatalkan.",
      doneTitle: "Pesanan selesai",
      doneDesc: "Pesanan sudah sampai ke penerima.",
      courierTitle: "Kurir sedang menuju lokasi",
      courierDesc: "Pesanan sudah diambil kurir dan sedang dalam perjalanan.",
      preparingTitle: "Pesanan sedang diproses",
      preparingDesc: "Tim Street Sushi sedang menyiapkan pesanan kamu.",
      paidTitle: "Pembayaran diterima",
      paidDesc: "Pesanan sudah masuk dan menunggu diproses oleh tim outlet.",
      pendingTitle: "Menunggu pembayaran",
      pendingDesc: "Pesanan sudah tercatat, tapi pembayaran belum terkonfirmasi."
    },
    en: {
      issueTitle: "Order needs attention",
      issueDesc: "The order cannot continue because the payment failed, expired, or was cancelled.",
      doneTitle: "Order completed",
      doneDesc: "The order has been delivered to the recipient.",
      courierTitle: "Courier is on the way",
      courierDesc: "The order has been picked up and is currently on the way.",
      preparingTitle: "Order is being prepared",
      preparingDesc: "The Street Sushi team is preparing your order.",
      paidTitle: "Payment received",
      paidDesc: "The order is in the system and waiting to be processed by the outlet team.",
      pendingTitle: "Waiting for payment",
      pendingDesc: "The order has been recorded, but payment has not been confirmed yet."
    }
  }[language] || {
    issueTitle: "Pesanan perlu perhatian",
    issueDesc: "Pesanan belum bisa lanjut karena pembayaran gagal, kedaluwarsa, atau dibatalkan.",
    doneTitle: "Pesanan selesai",
    doneDesc: "Pesanan sudah sampai ke penerima.",
    courierTitle: "Kurir sedang menuju lokasi",
    courierDesc: "Pesanan sudah diambil kurir dan sedang dalam perjalanan.",
    preparingTitle: "Pesanan sedang diproses",
    preparingDesc: "Tim Street Sushi sedang menyiapkan pesanan kamu.",
    paidTitle: "Pembayaran diterima",
    paidDesc: "Pesanan sudah masuk dan menunggu diproses oleh tim outlet.",
    pendingTitle: "Menunggu pembayaran",
    pendingDesc: "Pesanan sudah tercatat, tapi pembayaran belum terkonfirmasi."
  };

  if (orderStatus === "cancelled" || paymentStatus === "failed" || paymentStatus === "expired") {
    return {
      key: "issue",
      title: copy.issueTitle,
      description: copy.issueDesc
    };
  }

  if (deliveryStatus === "delivered" || orderStatus === "completed") {
    return {
      key: "done",
      title: copy.doneTitle,
      description: copy.doneDesc
    };
  }

  if (deliveryStatus === "picked_up") {
    return {
      key: "courier",
      title: copy.courierTitle,
      description: copy.courierDesc
    };
  }

  if (["booked", "quoted"].includes(deliveryStatus) || orderStatus === "processing") {
    return {
      key: "prepared",
      title: copy.preparingTitle,
      description: copy.preparingDesc
    };
  }

  if (paymentStatus === "paid" || orderStatus === "paid" || orderStatus === "confirmed") {
    return {
      key: "paid",
      title: copy.paidTitle,
      description: copy.paidDesc
    };
  }

  return {
    key: "pending",
    title: copy.pendingTitle,
    description: copy.pendingDesc
  };
}
