import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { hasMySqlEnv, hasSupabaseServerEnv } from "@/lib/store-config";
import { mysqlExecute, mysqlQuery } from "@/lib/mysql";
import { supabaseRequest } from "@/lib/supabase-rest";

const dataFile = path.join(process.cwd(), "data", "orders.json");
const deliveredStatuses = new Set(["delivered", "completed"]);

function parseMaybeJson(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value === "string") {
    if (!value.trim()) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  if (typeof value === "object") return value;
  return fallback;
}

function normalizeIsoDate(value, fallback = null) {
  if (!value) return fallback;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
  }
  if (typeof value === "string") return value;
  return fallback;
}

function toMySqlDateTime(value, fallback = null) {
  const normalized = normalizeIsoDate(value, fallback);
  if (!normalized) return null;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  return parsed.toISOString().slice(0, 19).replace("T", " ");
}

function resolveOrderStatus(input) {
  const current = String(input?.status || "pending").toLowerCase();
  const paymentStatus = String(input?.paymentStatus || "unpaid").toLowerCase();
  const deliveryStatus = String(input?.deliveryStatus || "pending").toLowerCase();
  const fulfillmentType = String(input?.fulfillmentType || "delivery").toLowerCase();

  if (["cancelled", "refunded"].includes(current)) {
    return current;
  }

  if (
    fulfillmentType === "delivery" &&
    paymentStatus === "paid" &&
    deliveredStatuses.has(deliveryStatus)
  ) {
    return "completed";
  }

  return current;
}

async function readOrders() {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writeOrders(orders) {
  await fs.writeFile(dataFile, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

function shouldFallbackToLocal(error) {
  if (process.env.ALLOW_LOCAL_ORDER_FALLBACK !== "true") {
    return false;
  }

  const message = String(error?.message || "");

  return (
    message.includes("Could not find the table 'public.orders'") ||
    message.includes("Could not find the table 'public.order_items'") ||
    message.includes("relation \"orders\" does not exist") ||
    message.includes("relation \"order_items\" does not exist")
  );
}

function normalizeOrder(input) {
  const items = Array.isArray(input.items) ? input.items : [];
  const subtotal =
    input.subtotal ||
    items.reduce(
      (total, item) => total + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  const deliveryFee = Number(input.deliveryFee || 0);
  const taxAmount = Number(input.taxAmount || input.metadata?.pb1Amount || 0);

  const normalized = {
    id: input.id || randomUUID(),
    reference: input.reference || `SS-${Date.now()}`,
    status: input.status || "pending",
    source: input.source || "online-shop",
    outletSlug:
      input.outletSlug ||
      input.outletId ||
      input.metadata?.checkoutDetails?.outletSlug ||
      input.metadata?.checkoutDetails?.outletId ||
      null,
    customerName: String(input.customerName || "").trim(),
    customerPhone: String(input.customerPhone || "").trim(),
    customerEmail: String(input.customerEmail || "").trim(),
    fulfillmentType: String(input.fulfillmentType || "delivery").trim(),
    subtotal,
    taxAmount,
    deliveryFee,
    total: Number(input.total || subtotal + taxAmount + deliveryFee),
    notes: String(input.notes || "").trim(),
    paymentStatus: input.paymentStatus || "unpaid",
    paymentProvider: input.paymentProvider || null,
    paymentReference: input.paymentReference || null,
    deliveryStatus: input.deliveryStatus || "pending",
    deliveryProvider: input.deliveryProvider || null,
    deliveryReference: input.deliveryReference || null,
    deliveryQuoteId: input.deliveryQuoteId || null,
    metadata: input.metadata || {},
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
    paidAt: input.paidAt || null,
    items: items.map((item) => ({
      productId: item.productId || item.id || null,
      productSlug: item.productSlug || null,
      name: String(item.name || "").trim(),
      note: String(item.note || "").trim(),
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      lineTotal:
        Number(item.lineTotal || 0) ||
        Number(item.price || 0) * Number(item.quantity || 1)
    }))
  };

  normalized.status = resolveOrderStatus(normalized);
  return normalized;
}

function mapSupabaseOrder(entry) {
  return {
    id: entry.id,
    reference: entry.reference,
    status: entry.status,
    source: entry.source,
    outletSlug: entry.outlet_slug || null,
    customerName: entry.customer_name,
    customerPhone: entry.customer_phone,
    customerEmail: entry.customer_email,
    fulfillmentType: entry.fulfillment_type,
    subtotal: entry.subtotal,
    taxAmount: entry.tax_total,
    deliveryFee: entry.delivery_fee,
    total: entry.grand_total,
    notes: entry.notes,
    paymentStatus: entry.payment_status,
    paymentProvider: entry.payment_provider,
    paymentReference: entry.payment_reference,
    deliveryStatus: entry.delivery_status,
    deliveryProvider: entry.delivery_provider,
    deliveryReference: entry.delivery_reference,
    deliveryQuoteId: entry.delivery_quote_id,
    metadata: entry.metadata || {},
    createdAt: entry.created_at || null,
    updatedAt: entry.updated_at || null,
    paidAt: entry.paid_at || null,
    items: (entry.order_items || []).map((item) => {
      const metadata = parseMaybeJson(item.metadata, {});

      return {
        productId: item.product_id,
        productSlug: metadata.productSlug || null,
        name: item.name,
        note: String(metadata.note || "").trim(),
        quantity: item.quantity,
        price: item.unit_price,
        lineTotal: item.line_total
      };
    })
  };
}

function mapOrderInsert(order) {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    source: order.source,
    outlet_slug: order.outletSlug,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail,
    fulfillment_type: order.fulfillmentType,
    subtotal: order.subtotal,
    tax_total: order.taxAmount,
    delivery_fee: order.deliveryFee,
    grand_total: order.total,
    notes: order.notes,
    payment_status: order.paymentStatus,
    payment_provider: order.paymentProvider,
    payment_reference: order.paymentReference,
    delivery_status: order.deliveryStatus,
    delivery_provider: order.deliveryProvider,
    delivery_reference: order.deliveryReference,
    delivery_quote_id: order.deliveryQuoteId,
    metadata: order.metadata
  };
}

function mapOrderItemInsert(order, item) {
  return {
    order_id: order.id,
    product_id: item.productId,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    line_total: item.lineTotal,
    metadata: {
      ...(item.productSlug ? { productSlug: item.productSlug } : {}),
      ...(item.note ? { note: item.note } : {})
    }
  };
}

export async function createOrder(input) {
  const order = normalizeOrder(input);

  if (hasMySqlEnv()) {
    const metadataJson = JSON.stringify(order.metadata || {});
    const insertSql = `insert into orders
        (id, reference, source, outlet_slug, status, fulfillment_type, customer_name, customer_phone, customer_email, subtotal, tax_total, delivery_fee, grand_total, notes, payment_status, payment_provider, payment_reference, delivery_status, delivery_provider, delivery_reference, delivery_quote_id, paid_at, metadata, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())`;

    const params = [
      order.id,
      order.reference,
      order.source,
      order.outletSlug,
      order.status,
      order.fulfillmentType,
      order.customerName,
      order.customerPhone,
      order.customerEmail || null,
      order.subtotal,
      order.taxAmount,
      order.deliveryFee,
      order.total,
      order.notes || null,
      order.paymentStatus,
      order.paymentProvider,
      order.paymentReference,
      order.deliveryStatus,
      order.deliveryProvider,
      order.deliveryReference,
      order.deliveryQuoteId,
      toMySqlDateTime(order.paidAt),
      metadataJson
    ];

    try {
      await mysqlExecute(insertSql, params);
    } catch (error) {
      // If outlets haven't been seeded yet, keep checkout flowing by storing outlet in metadata
      // and inserting a NULL outlet_slug so the FK doesn't block order creation.
      const message = String(error?.message || "");
      const code = String(error?.code || "");
      const isOutletFk =
        code === "ER_NO_REFERENCED_ROW_2" ||
        message.includes("orders_outlet_slug_fk") ||
        message.includes("FOREIGN KEY (`outlet_slug`)");

      if (!isOutletFk) {
        throw error;
      }

      const retryParams = [...params];
      retryParams[3] = null; // outlet_slug
      await mysqlExecute(insertSql, retryParams);
    }

    if (order.items.length) {
      for (const item of order.items) {
        await mysqlExecute(
          `insert into order_items
            (order_id, product_id, name, quantity, unit_price, line_total, metadata)
           values (?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            item.productId,
            item.name,
            item.quantity,
            item.price,
            item.lineTotal,
            JSON.stringify({
              ...(item.productSlug ? { productSlug: item.productSlug } : {}),
              ...(item.note ? { note: item.note } : {})
            })
          ]
        );
      }
    }

    return order;
  }

  if (hasSupabaseServerEnv()) {
    try {
      await supabaseRequest("orders", {
        method: "POST",
        body: [mapOrderInsert(order)]
      });

      if (order.items.length) {
        await supabaseRequest("order_items", {
          method: "POST",
          body: order.items.map((item) => mapOrderItemInsert(order, item))
        });
      }

      return order;
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  const orders = await readOrders();
  orders.unshift(order);
  await writeOrders(orders);
  return order;
}

export async function updateOrderByReference(reference, updates) {
  const existing = await findOrderByReference(reference);
  if (!existing) return null;

  const next = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
    paidAt:
      updates.paidAt !== undefined
        ? updates.paidAt
        : updates.status === "paid" || updates.paymentStatus === "paid"
          ? new Date().toISOString()
          : existing.paidAt || null
  };
  next.status = resolveOrderStatus(next);

  if (hasMySqlEnv()) {

    await mysqlExecute(
      `update orders
       set status=?, payment_status=?, payment_provider=?, payment_reference=?, delivery_status=?, delivery_provider=?, delivery_reference=?, delivery_quote_id=?, outlet_slug=?, paid_at=?, metadata=?, updated_at=now()
       where reference=?`,
      [
        next.status,
        next.paymentStatus,
        next.paymentProvider,
        next.paymentReference,
        next.deliveryStatus,
        next.deliveryProvider,
        next.deliveryReference,
        next.deliveryQuoteId,
        next.outletSlug,
        toMySqlDateTime(next.paidAt),
        JSON.stringify(next.metadata || {}),
        reference
      ]
    );

    return next;
  }

  if (hasSupabaseServerEnv()) {
    try {
      const patch = {};

      patch.status = next.status;
      patch.payment_status = next.paymentStatus;
      patch.payment_provider = next.paymentProvider;
      patch.payment_reference = next.paymentReference;
      patch.delivery_status = next.deliveryStatus;
      patch.delivery_provider = next.deliveryProvider;
      patch.delivery_reference = next.deliveryReference;
      patch.delivery_quote_id = next.deliveryQuoteId;
      patch.outlet_slug = next.outletSlug;
      patch.metadata = next.metadata;
      patch.paid_at = next.paidAt;
      patch.updated_at = new Date().toISOString();

      const data = await supabaseRequest("orders", {
        method: "PATCH",
        query: {
          reference: `eq.${reference}`,
          select: "*,order_items(*)"
        },
        body: patch
      });

      return data?.[0] ? mapSupabaseOrder(data[0]) : null;
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  const orders = await readOrders();
  const index = orders.findIndex((entry) => entry.reference === reference);

  if (index === -1) {
    return null;
  }

  orders[index] = {
    ...orders[index],
    ...next
  };

  await writeOrders(orders);
  return orders[index];
}

export async function findOrderByReference(reference) {
  if (hasMySqlEnv()) {
    const rows = await mysqlQuery("select * from orders where reference = ? limit 1", [
      reference
    ]);
    const orderRow = rows?.[0];
    if (!orderRow) return null;

    const items = await mysqlQuery(
      "select * from order_items where order_id = ? order by id asc",
      [orderRow.id]
    );

    const order = {
      id: orderRow.id,
      reference: orderRow.reference,
      status: orderRow.status,
      source: orderRow.source,
      outletSlug: orderRow.outlet_slug,
      customerName: orderRow.customer_name,
      customerPhone: orderRow.customer_phone,
      customerEmail: orderRow.customer_email,
      fulfillmentType: orderRow.fulfillment_type,
      subtotal: Number(orderRow.subtotal || 0),
      taxAmount: Number(orderRow.tax_total || 0),
      deliveryFee: Number(orderRow.delivery_fee || 0),
      total: Number(orderRow.grand_total || 0),
      notes: orderRow.notes || "",
      paymentStatus: orderRow.payment_status,
      paymentProvider: orderRow.payment_provider,
      paymentReference: orderRow.payment_reference,
      deliveryStatus: orderRow.delivery_status,
      deliveryProvider: orderRow.delivery_provider,
      deliveryReference: orderRow.delivery_reference,
      deliveryQuoteId: orderRow.delivery_quote_id,
      metadata: parseMaybeJson(orderRow.metadata, {}),
      createdAt: normalizeIsoDate(orderRow.created_at),
      updatedAt: normalizeIsoDate(orderRow.updated_at),
      paidAt: normalizeIsoDate(orderRow.paid_at),
      items: (items || []).map((item) => {
        const metadata = parseMaybeJson(item.metadata, {});

        return {
          productId: item.product_id,
          productSlug: metadata.productSlug || null,
          name: item.name,
          note: String(metadata.note || "").trim(),
          quantity: item.quantity,
          price: item.unit_price,
          lineTotal: item.line_total
        };
      })
    };

    order.status = resolveOrderStatus(order);
    return order;
  }

  if (hasSupabaseServerEnv()) {
    const data = await supabaseRequest("orders", {
      query: {
        reference: `eq.${reference}`,
        select: "*,order_items(*)"
      }
    });

    return data?.[0] ? mapSupabaseOrder(data[0]) : null;
  }

  const orders = await readOrders();
  return orders.find((entry) => entry.reference === reference) || null;
}

export async function listOrders() {
  if (hasMySqlEnv()) {
    const rows = await mysqlQuery("select * from orders order by created_at desc");
    const orders = [];

    for (const row of rows) {
      const items = await mysqlQuery(
        "select * from order_items where order_id = ? order by id asc",
        [row.id]
      );

      const order = {
        id: row.id,
        reference: row.reference,
        status: row.status,
        source: row.source,
        outletSlug: row.outlet_slug,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email,
        fulfillmentType: row.fulfillment_type,
        subtotal: Number(row.subtotal || 0),
        taxAmount: Number(row.tax_total || 0),
        deliveryFee: Number(row.delivery_fee || 0),
        total: Number(row.grand_total || 0),
        notes: row.notes || "",
        paymentStatus: row.payment_status,
        paymentProvider: row.payment_provider,
        paymentReference: row.payment_reference,
        deliveryStatus: row.delivery_status,
        deliveryProvider: row.delivery_provider,
        deliveryReference: row.delivery_reference,
        deliveryQuoteId: row.delivery_quote_id,
        metadata: parseMaybeJson(row.metadata, {}),
        createdAt: normalizeIsoDate(row.created_at),
        updatedAt: normalizeIsoDate(row.updated_at),
        paidAt: normalizeIsoDate(row.paid_at),
        items: (items || []).map((item) => {
          const metadata = parseMaybeJson(item.metadata, {});

          return {
            productId: item.product_id,
            productSlug: metadata.productSlug || null,
            name: item.name,
            note: String(metadata.note || "").trim(),
            quantity: item.quantity,
            price: item.unit_price,
            lineTotal: item.line_total
          };
        })
      };

      order.status = resolveOrderStatus(order);
      orders.push(order);
    }

    return orders;
  }

  if (hasSupabaseServerEnv()) {
    const data = await supabaseRequest("orders", {
      query: {
        select: "*,order_items(*)",
        order: "created_at.desc"
      }
    });

    return (data || []).map(mapSupabaseOrder);
  }

  const orders = await readOrders();
  return orders.sort((left, right) => {
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
  });
}

export async function listOrdersByCustomer({ phone, email } = {}) {
  const normalizedPhone = String(phone || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (hasMySqlEnv()) {
    if (!normalizedPhone && !normalizedEmail) {
      return [];
    }

    const clauses = [];
    const params = [];

    if (normalizedPhone) {
      clauses.push("customer_phone = ?");
      params.push(normalizedPhone);
    }

    if (normalizedEmail) {
      clauses.push("lower(customer_email) = ?");
      params.push(normalizedEmail);
    }

    const rows = await mysqlQuery(
      `select reference from orders where ${clauses.join(" or ")} order by created_at desc limit 20`,
      params
    );

    const orders = [];
    for (const row of rows) {
      const order = await findOrderByReference(row.reference);
      if (order) orders.push(order);
    }

    return orders;
  }

  const orders = await listOrders();
  return orders.filter((order) => {
    const phoneMatch = normalizedPhone && String(order.customerPhone || "").trim() === normalizedPhone;
    const emailMatch =
      normalizedEmail && String(order.customerEmail || "").trim().toLowerCase() === normalizedEmail;
    return phoneMatch || emailMatch;
  });
}

export async function countPaidOrdersByCustomer({ phone, email } = {}) {
  const normalizedPhone = String(phone || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (hasMySqlEnv()) {
    if (!normalizedPhone && !normalizedEmail) {
      return 0;
    }

    const clauses = [];
    const params = [];

    if (normalizedPhone) {
      clauses.push("customer_phone = ?");
      params.push(normalizedPhone);
    }

    if (normalizedEmail) {
      clauses.push("lower(customer_email) = ?");
      params.push(normalizedEmail);
    }

    const rows = await mysqlQuery(
      `select count(*) as total
         from orders
        where payment_status = 'paid'
          and (${clauses.join(" or ")})`,
      params
    );

    return Number(rows?.[0]?.total || 0);
  }

  const orders = await listOrdersByCustomer({ phone, email });
  return orders.filter((order) => String(order.paymentStatus || "").toLowerCase() === "paid").length;
}

export async function createPaymentTransaction(input) {
  if (hasMySqlEnv()) {
    await mysqlExecute(
      `insert into payment_transactions
        (id, order_id, provider, provider_transaction_id, provider_reference, payment_method_type, payment_channel, amount, currency, status, checkout_url, expires_at, paid_at, raw_response, metadata, created_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())`,
      [
        input.id || randomUUID(),
        input.orderId,
        input.provider,
        input.providerTransactionId || null,
        input.providerReference || null,
        input.paymentMethodType || null,
        input.paymentChannel || null,
        input.amount || 0,
        input.currency || "IDR",
        input.status || "pending",
        input.checkoutUrl || null,
        toMySqlDateTime(input.expiresAt),
        toMySqlDateTime(input.paidAt),
        JSON.stringify(input.rawResponse || {}),
        JSON.stringify(input.metadata || {})
      ]
    );
    return true;
  }

  if (!hasSupabaseServerEnv()) return null;

  return supabaseRequest("payment_transactions", {
    method: "POST",
    body: [
      {
        id: input.id || randomUUID(),
        order_id: input.orderId,
        provider: input.provider,
        provider_transaction_id: input.providerTransactionId || null,
        provider_reference: input.providerReference || null,
        payment_method_type: input.paymentMethodType || null,
        payment_channel: input.paymentChannel || null,
        amount: input.amount || 0,
        currency: input.currency || "IDR",
        status: input.status || "pending",
        checkout_url: input.checkoutUrl || null,
        expires_at: input.expiresAt || null,
        paid_at: input.paidAt || null,
        raw_response: input.rawResponse || {},
        metadata: input.metadata || {}
      }
    ]
  });
}

export async function createPaymentLog(input) {
  if (hasMySqlEnv()) {
    await mysqlExecute(
      `insert into payment_logs
        (id, order_id, payment_transaction_id, event_type, provider, provider_event_id, status, payload, created_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, now())`,
      [
        input.id || randomUUID(),
        input.orderId,
        input.paymentTransactionId || null,
        input.eventType,
        input.provider || null,
        input.providerEventId || null,
        input.status || null,
        JSON.stringify(input.payload || {})
      ]
    );
    return true;
  }

  if (!hasSupabaseServerEnv()) return null;

  return supabaseRequest("payment_logs", {
    method: "POST",
    body: [
      {
        order_id: input.orderId,
        payment_transaction_id: input.paymentTransactionId || null,
        event_type: input.eventType,
        provider: input.provider || null,
        provider_event_id: input.providerEventId || null,
        status: input.status || null,
        payload: input.payload || {}
      }
    ]
  });
}
