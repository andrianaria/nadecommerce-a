import nodemailer from "nodemailer";
import { formatRupiah } from "@/lib/formatters";

const defaultNotificationEmail = "support@example.com";
const defaultNotificationWhatsapp = "";

function getOrderLanguage(order) {
  return order?.metadata?.customerLanguage === "en" ? "en" : "id";
}

function getNotificationDeliveryAddress(details = {}) {
  return String(details.deliveryAddressDetail || details.deliveryAddress || "").trim();
}

function buildNotificationLines(order) {
  const details = order.metadata?.checkoutDetails || {};
  const deliveryAddress = getNotificationDeliveryAddress(details);
  const lines = [
    `Order baru sudah dibayar: ${order.reference}`,
    "",
    order.customerName ? `Nama pemesan: ${order.customerName}` : null,
    order.customerPhone ? `Nomor pemesan: ${order.customerPhone}` : null,
    order.customerEmail ? `Email: ${order.customerEmail}` : null,
    details.recipientName ? `Nama penerima: ${details.recipientName}` : null,
    details.recipientPhone ? `Nomor penerima: ${details.recipientPhone}` : null,
    deliveryAddress ? `Alamat kirim: ${deliveryAddress}` : null,
    details.outletId ? `Outlet: ${details.outletId}` : null,
    details.deliveryDate ? `Tanggal kirim: ${details.deliveryDate}` : null,
    details.deliveryTime ? `Jam kirim: ${details.deliveryTime}` : null,
    details.cardMessage ? `Ucapan di kartu: ${details.cardMessage}` : null,
    order.notes ? `Catatan: ${order.notes}` : null,
    "",
    "Item pesanan:",
    ...(order.items || []).map(
      (item) => `- ${item.name} x ${item.quantity} (${formatRupiah(item.lineTotal || item.price * item.quantity)})`
    ),
    "",
    `Subtotal: ${formatRupiah(order.subtotal || 0)}`,
    `PB1 10%: ${formatRupiah(order.taxAmount || order.metadata?.pb1Amount || 0)}`,
    `Total: ${formatRupiah(order.total || 0)}`
  ];

  return lines.filter((line) => line !== null).join("\n");
}

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM_EMAIL
  );
}

function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function buildOrderSummaryLines(order) {
  return (order.items || []).map((item) => {
    const note = item.note ? ` • ${item.note}` : "";
    return `- ${item.name} x ${item.quantity}${note} (${formatRupiah(
      item.lineTotal || item.price * item.quantity
    )})`;
  });
}

function buildCustomerEmailSubject(order, type = "created") {
  const language = getOrderLanguage(order);
  if (type === "paid") {
    return language === "en"
      ? `Street Sushi payment confirmed • ${order.reference}`
      : `Pembayaran Street Sushi berhasil • ${order.reference}`;
  }

  return language === "en"
    ? `Street Sushi order received • ${order.reference}`
    : `Pesanan Street Sushi diterima • ${order.reference}`;
}

function buildCustomerEmailText(order, type = "created") {
  const language = getOrderLanguage(order);
  const details = order.metadata?.checkoutDetails || {};
  const deliveryAddress = getNotificationDeliveryAddress(details);
  const opener =
    type === "paid"
      ? language === "en"
        ? `We have received payment for order ${order.reference}.`
        : `Pembayaran untuk pesanan ${order.reference} sudah kami terima.`
      : language === "en"
        ? `Order ${order.reference} has been received by Street Sushi.`
        : `Pesanan ${order.reference} sudah masuk ke sistem Street Sushi.`;

  return [
    `${language === "en" ? "Hi" : "Halo"} ${order.customerName || "Street Sushi Customer"},`,
    "",
    opener,
    "",
    details.recipientName
      ? `${language === "en" ? "Recipient" : "Penerima"}: ${details.recipientName}`
      : null,
    deliveryAddress
      ? `${language === "en" ? "Delivery address" : "Alamat kirim"}: ${deliveryAddress}`
      : null,
    details.deliveryDate
      ? `${language === "en" ? "Delivery date" : "Tanggal kirim"}: ${details.deliveryDate}`
      : null,
    details.deliveryTime
      ? `${language === "en" ? "Delivery time" : "Jam kirim"}: ${details.deliveryTime}`
      : null,
    "",
    language === "en" ? "Order summary:" : "Ringkasan pesanan:",
    ...buildOrderSummaryLines(order),
    "",
    `Subtotal: ${formatRupiah(order.subtotal || 0)}`,
    `PB1 10%: ${formatRupiah(order.taxAmount || order.metadata?.pb1Amount || 0)}`,
    `Total: ${formatRupiah(order.total || 0)}`,
    "",
    type === "paid"
      ? language === "en"
        ? "Your order is now being prepared. Thank you for ordering from Street Sushi."
        : "Pesananmu sedang kami proses. Terima kasih sudah order di Street Sushi."
      : language === "en"
        ? "Please complete payment if you haven't yet, or contact our team if you need help."
        : "Silakan lanjutkan pembayaran jika belum selesai, atau hubungi tim kami jika butuh bantuan.",
    "",
    "Street Sushi"
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCustomerEmailHtml(order, type = "created") {
  const language = getOrderLanguage(order);
  const details = order.metadata?.checkoutDetails || {};
  const deliveryAddress = getNotificationDeliveryAddress(details);
  const opener =
    type === "paid"
      ? language === "en"
        ? `We have received payment for order <strong>${order.reference}</strong>.`
        : `Pembayaran untuk pesanan <strong>${order.reference}</strong> sudah kami terima.`
      : language === "en"
        ? `Order <strong>${order.reference}</strong> has been received by Street Sushi.`
        : `Pesanan <strong>${order.reference}</strong> sudah masuk ke sistem Street Sushi.`;

  const itemsHtml = buildOrderSummaryLines(order)
    .map((line) => `<li>${line}</li>`)
    .join("");

  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #1f1a17; line-height: 1.6;">
      <p>${language === "en" ? "Hi" : "Halo"} ${order.customerName || "Street Sushi Customer"},</p>
      <p>${opener}</p>
      <div style="padding: 16px; border: 1px solid #ece7df; border-radius: 14px; background: #fffaf5;">
        <p style="margin: 0 0 8px;"><strong>Referensi:</strong> ${order.reference}</p>
        ${details.recipientName ? `<p style="margin: 0 0 8px;"><strong>${language === "en" ? "Recipient" : "Penerima"}:</strong> ${details.recipientName}</p>` : ""}
        ${deliveryAddress ? `<p style="margin: 0 0 8px;"><strong>${language === "en" ? "Delivery address" : "Alamat kirim"}:</strong> ${deliveryAddress}</p>` : ""}
        ${details.deliveryDate ? `<p style="margin: 0 0 8px;"><strong>${language === "en" ? "Delivery date" : "Tanggal kirim"}:</strong> ${details.deliveryDate}</p>` : ""}
        ${details.deliveryTime ? `<p style="margin: 0;"><strong>${language === "en" ? "Delivery time" : "Jam kirim"}:</strong> ${details.deliveryTime}</p>` : ""}
      </div>
      <h3 style="margin: 24px 0 8px;">${language === "en" ? "Order summary" : "Ringkasan pesanan"}</h3>
      <ul style="padding-left: 18px;">${itemsHtml}</ul>
      <p><strong>Subtotal:</strong> ${formatRupiah(order.subtotal || 0)}<br />
      <strong>PB1 10%:</strong> ${formatRupiah(order.taxAmount || order.metadata?.pb1Amount || 0)}<br />
      <strong>Total:</strong> ${formatRupiah(order.total || 0)}</p>
      <p>${
        type === "paid"
          ? language === "en"
            ? "Your order is now being prepared. Thank you for ordering from Street Sushi."
            : "Pesananmu sedang kami proses. Terima kasih sudah order di Street Sushi."
          : language === "en"
            ? "Please complete payment if you haven't yet, or contact our team if you need help."
            : "Silakan lanjutkan pembayaran jika belum selesai, atau hubungi tim kami jika butuh bantuan."
      }</p>
      <p>Street Sushi</p>
    </div>
  `;
}

async function sendResendEmail({ to, subject, text, html }) {
  if (!hasResendConfig()) {
    return { channel: "resend", skipped: true, reason: "missing_resend_config" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    throw new Error(`Resend email failed: ${await response.text()}`);
  }

  const payload = await response.json();
  return {
    channel: "resend",
    skipped: false,
    id: payload.id || null
  };
}

async function sendEmailNotification(order, message) {
  if (hasResendConfig()) {
    return sendResendEmail({
      to: process.env.NOTIFICATION_EMAIL_TO || defaultNotificationEmail,
      subject: `Street Sushi paid order ${order.reference}`,
      text: message,
      html: `<pre style="font-family: Inter, Arial, sans-serif; white-space: pre-wrap;">${message}</pre>`
    });
  }

  if (!hasSmtpConfig()) {
    return { channel: "email", skipped: true, reason: "missing_smtp_config" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: process.env.NOTIFICATION_EMAIL_TO || defaultNotificationEmail,
    subject: `Street Sushi paid order ${order.reference}`,
    text: message
  });

  return {
    channel: "email",
    skipped: false,
    id: info.messageId || null
  };
}

function hasWhatsappConfig() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function sendWhatsappNotification(message) {
  if (!hasWhatsappConfig()) {
    return { channel: "whatsapp", skipped: true, reason: "missing_whatsapp_config" };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";
  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: process.env.NOTIFICATION_WHATSAPP_TO || defaultNotificationWhatsapp,
        type: "text",
        text: {
          preview_url: false,
          body: message
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`WhatsApp notification failed: ${await response.text()}`);
  }

  const payload = await response.json();

  return {
    channel: "whatsapp",
    skipped: false,
    id: payload.messages?.[0]?.id || null
  };
}

export async function sendPaidOrderNotifications(order) {
  const message = buildNotificationLines(order);
  const [email, whatsapp] = await Promise.all([
    sendEmailNotification(order, message),
    sendWhatsappNotification(message)
  ]);

  return {
    email,
    whatsapp,
    message
  };
}

export async function sendCustomerOrderEmail(order, type = "created") {
  if (!order?.customerEmail) {
    return { channel: "customer-email", skipped: true, reason: "missing_customer_email" };
  }

  const subject = buildCustomerEmailSubject(order, type);
  const text = buildCustomerEmailText(order, type);
  const html = buildCustomerEmailHtml(order, type);

  if (hasResendConfig()) {
    return sendResendEmail({
      to: order.customerEmail,
      subject,
      text,
      html
    });
  }

  if (!hasSmtpConfig()) {
    return { channel: "customer-email", skipped: true, reason: "missing_email_config" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: order.customerEmail,
    subject,
    text,
    html
  });

  return {
    channel: "customer-email",
    skipped: false,
    id: info.messageId || null
  };
}
