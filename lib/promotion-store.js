import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { buildOrderItems, calculateSubtotal } from "@/lib/checkout-payloads";
import { countPaidOrdersByCustomer } from "@/lib/order-store";
import { hasMySqlEnv } from "@/lib/store-config";
import { isMySqlConnectionError, mysqlExecute, mysqlQuery } from "@/lib/mysql";

const dataFile = path.join(process.cwd(), "data", "promotions.json");

function canFallbackToLocalFile() {
  return !process.env.VERCEL;
}

function formatMySqlDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function normalizeDateTimeInput(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : formatMySqlDateTime(date);
}

function normalizeCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return code || null;
}

function normalizePromotion(input) {
  return {
    id: String(input.id || randomUUID()),
    code: normalizeCode(input.code),
    name: String(input.name || "").trim(),
    description: String(input.description || "").trim(),
    eligibilityScope: String(input.eligibilityScope || "all").trim(),
    discountType: String(input.discountType || "fixed").trim(),
    discountValue: Math.max(0, Number(input.discountValue || 0)),
    maxDiscount:
      input.maxDiscount === "" || input.maxDiscount == null
        ? null
        : Math.max(0, Number(input.maxDiscount || 0)),
    minSubtotal: Math.max(0, Number(input.minSubtotal || 0)),
    autoApply: Boolean(input.autoApply),
    isActive: input.isActive !== false,
    startsAt: normalizeDateTimeInput(input.startsAt),
    endsAt: normalizeDateTimeInput(input.endsAt),
    productSlugs: Array.isArray(input.productSlugs) ? input.productSlugs.filter(Boolean) : [],
    outletSlugs: Array.isArray(input.outletSlugs) ? input.outletSlugs.filter(Boolean) : [],
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString()
  };
}

function mapMySqlPromotion(row, productSlugs = [], outletSlugs = []) {
  return {
    id: row.id,
    code: row.code || null,
    name: row.name,
    description: row.description || "",
    eligibilityScope: row.eligibility_scope || "all",
    discountType: row.discount_type || "fixed",
    discountValue: Number(row.discount_value || 0),
    maxDiscount: row.max_discount == null ? null : Number(row.max_discount || 0),
    minSubtotal: Number(row.min_subtotal || 0),
    autoApply: Boolean(row.auto_apply),
    isActive: Boolean(row.is_active),
    startsAt: row.starts_at instanceof Date ? row.starts_at.toISOString() : row.starts_at || null,
    endsAt: row.ends_at instanceof Date ? row.ends_at.toISOString() : row.ends_at || null,
    productSlugs,
    outletSlugs,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

async function readPromotions() {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writePromotions(promotions) {
  await fs.writeFile(dataFile, `${JSON.stringify(promotions, null, 2)}\n`, "utf8");
}

function shouldFallbackToLocal(error) {
  const message = String(error?.message || "");
  const code = String(error?.code || "");
  return (
    isMySqlConnectionError(error) ||
    code === "ER_NO_SUCH_TABLE" ||
    message.includes("doesn't exist") ||
    message.includes("Unknown column")
  );
}

export async function listPromotions() {
  if (hasMySqlEnv()) {
    try {
      const rows = await mysqlQuery("select * from promotions order by created_at desc");
      const productRows = await mysqlQuery(
        "select promotion_id, product_slug from promotion_products order by promotion_id asc"
      );
      const outletRows = await mysqlQuery(
        "select promotion_id, outlet_slug from promotion_outlets order by promotion_id asc"
      );

      const productsByPromotion = new Map();
      const outletsByPromotion = new Map();

      for (const row of productRows) {
        const current = productsByPromotion.get(row.promotion_id) || [];
        current.push(row.product_slug);
        productsByPromotion.set(row.promotion_id, current);
      }

      for (const row of outletRows) {
        const current = outletsByPromotion.get(row.promotion_id) || [];
        current.push(row.outlet_slug);
        outletsByPromotion.set(row.promotion_id, current);
      }

      return rows.map((row) =>
        mapMySqlPromotion(
          row,
          productsByPromotion.get(row.id) || [],
          outletsByPromotion.get(row.id) || []
        )
      );
    } catch (error) {
      if (!shouldFallbackToLocal(error) || !canFallbackToLocalFile()) throw error;
    }
  }

  const promotions = await readPromotions();
  return promotions.sort(
    (left, right) =>
      new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  );
}

export async function findPromotionById(id) {
  const promotions = await listPromotions();
  return promotions.find((promotion) => promotion.id === id) || null;
}

export async function createPromotion(input) {
  const promotion = normalizePromotion(input);

  if (!promotion.name) {
    throw new Error("Nama promosi wajib diisi.");
  }

  const existing = await listPromotions();
  if (promotion.code && existing.some((entry) => entry.code === promotion.code)) {
    throw new Error("Kode promo sudah digunakan.");
  }

  if (hasMySqlEnv()) {
    try {
      await mysqlExecute(
        `insert into promotions
          (id, code, name, description, eligibility_scope, discount_type, discount_value, max_discount, min_subtotal, auto_apply, is_active, starts_at, ends_at, metadata)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          promotion.id,
          promotion.code,
          promotion.name,
          promotion.description || null,
          promotion.eligibilityScope,
          promotion.discountType,
          promotion.discountValue,
          promotion.maxDiscount,
          promotion.minSubtotal,
          promotion.autoApply ? 1 : 0,
          promotion.isActive ? 1 : 0,
          promotion.startsAt,
          promotion.endsAt,
          JSON.stringify({})
        ]
      );

      for (const productSlug of promotion.productSlugs) {
        await mysqlExecute(
          "insert into promotion_products (promotion_id, product_slug) values (?, ?)",
          [promotion.id, productSlug]
        );
      }

      for (const outletSlug of promotion.outletSlugs) {
        await mysqlExecute(
          "insert into promotion_outlets (promotion_id, outlet_slug) values (?, ?)",
          [promotion.id, outletSlug]
        );
      }

      return promotion;
    } catch (error) {
      if (!shouldFallbackToLocal(error) || !canFallbackToLocalFile()) throw error;
    }
  }

  existing.unshift(promotion);
  await writePromotions(existing);
  return promotion;
}

export async function updatePromotion(id, input) {
  const current = await findPromotionById(id);
  if (!current) {
    throw new Error("Promosi tidak ditemukan.");
  }

  const promotion = normalizePromotion({
    ...current,
    ...input,
    id,
    createdAt: current.createdAt
  });

  const all = await listPromotions();
  if (promotion.code && all.some((entry) => entry.id !== id && entry.code === promotion.code)) {
    throw new Error("Kode promo sudah digunakan.");
  }

  if (hasMySqlEnv()) {
    try {
      await mysqlExecute(
        `update promotions
            set code=?, name=?, description=?, eligibility_scope=?, discount_type=?, discount_value=?, max_discount=?, min_subtotal=?, auto_apply=?, is_active=?, starts_at=?, ends_at=?, updated_at=now()
          where id=?`,
        [
          promotion.code,
          promotion.name,
          promotion.description || null,
          promotion.eligibilityScope,
          promotion.discountType,
          promotion.discountValue,
          promotion.maxDiscount,
          promotion.minSubtotal,
          promotion.autoApply ? 1 : 0,
          promotion.isActive ? 1 : 0,
          promotion.startsAt,
          promotion.endsAt,
          id
        ]
      );

      await mysqlExecute("delete from promotion_products where promotion_id = ?", [id]);
      await mysqlExecute("delete from promotion_outlets where promotion_id = ?", [id]);

      for (const productSlug of promotion.productSlugs) {
        await mysqlExecute(
          "insert into promotion_products (promotion_id, product_slug) values (?, ?)",
          [id, productSlug]
        );
      }

      for (const outletSlug of promotion.outletSlugs) {
        await mysqlExecute(
          "insert into promotion_outlets (promotion_id, outlet_slug) values (?, ?)",
          [id, outletSlug]
        );
      }

      return promotion;
    } catch (error) {
      if (!shouldFallbackToLocal(error) || !canFallbackToLocalFile()) throw error;
    }
  }

  const next = all.map((entry) => (entry.id === id ? promotion : entry));
  await writePromotions(next);
  return promotion;
}

export async function deletePromotion(id) {
  if (hasMySqlEnv()) {
    try {
      await mysqlExecute("delete from promotions where id = ?", [id]);
      return { ok: true };
    } catch (error) {
      if (!shouldFallbackToLocal(error) || !canFallbackToLocalFile()) throw error;
    }
  }

  const all = await listPromotions();
  const next = all.filter((entry) => entry.id !== id);
  await writePromotions(next);
  return { ok: true };
}

function isPromotionActive(promotion, now = new Date()) {
  if (!promotion?.isActive) return false;
  const startsAt = promotion.startsAt ? new Date(promotion.startsAt) : null;
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

function computeDiscount(promotion, applicableSubtotal) {
  if (promotion.discountType === "percentage") {
    return Math.round(applicableSubtotal * (Number(promotion.discountValue || 0) / 100));
  }
  return Math.round(Number(promotion.discountValue || 0));
}

async function evaluatePromotion(promotion, context) {
  const { items, subtotal, outletSlug, member, language = "id" } = context;
  const msg = {
    inactive:
      language === "en" ? "This promotion is currently inactive." : "Promosi sedang tidak aktif.",
    wrongOutlet:
      language === "en" ? "This promotion is not valid for this outlet." : "Promosi tidak berlaku di outlet ini.",
    memberOnly: language === "en" ? "This promo is for members only." : "Promo ini khusus member.",
    firstOrderOnly:
      language === "en"
        ? "This promo is only valid for a member's first order."
        : "Promo ini hanya berlaku untuk pesanan pertama member.",
    productMismatch:
      language === "en"
        ? "The items in your cart do not match this promotion."
        : "Produk dalam keranjang tidak sesuai promo.",
    minSubtotal:
      language === "en" ? "The minimum spend has not been reached yet." : "Minimum belanja belum terpenuhi.",
    invalidDiscount:
      language === "en" ? "The discount amount is invalid." : "Nominal diskon tidak valid."
  };

  if (!isPromotionActive(promotion)) {
    return { eligible: false, reason: msg.inactive };
  }

  if (promotion.outletSlugs.length && !promotion.outletSlugs.includes(outletSlug)) {
    return { eligible: false, reason: msg.wrongOutlet };
  }

  if (promotion.eligibilityScope === "member" && !member) {
    return { eligible: false, reason: msg.memberOnly };
  }

  if (promotion.eligibilityScope === "first_order_member") {
    if (!member) {
      return { eligible: false, reason: msg.memberOnly };
    }

    const paidCount = await countPaidOrdersByCustomer({
      phone: member.phone,
      email: member.email
    });

    if (paidCount > 0) {
      return { eligible: false, reason: msg.firstOrderOnly };
    }
  }

  const applicableItems = promotion.productSlugs.length
    ? items.filter((item) => promotion.productSlugs.includes(item.productSlug || item.productId))
    : items;
  const applicableSubtotal = calculateSubtotal(applicableItems);
  const minimumBase = promotion.productSlugs.length ? applicableSubtotal : subtotal;

  if (!applicableItems.length || applicableSubtotal <= 0) {
    return { eligible: false, reason: msg.productMismatch };
  }

  if (minimumBase < Number(promotion.minSubtotal || 0)) {
    return { eligible: false, reason: msg.minSubtotal };
  }

  let discountAmount = computeDiscount(promotion, applicableSubtotal);
  if (promotion.maxDiscount != null) {
    discountAmount = Math.min(discountAmount, Number(promotion.maxDiscount || 0));
  }
  discountAmount = Math.min(discountAmount, applicableSubtotal);

  if (discountAmount <= 0) {
    return { eligible: false, reason: msg.invalidDiscount };
  }

  return {
    eligible: true,
    promotion,
    applicableSubtotal,
    discountAmount
  };
}

export async function previewPromotionApplication({
  cartLines = [],
  outletSlug = "",
  code = "",
  member = null,
  products = [],
  language = "id"
}) {
  const promotions = await listPromotions();
  const items = buildOrderItems(products, cartLines);
  const subtotal = calculateSubtotal(items);
  const normalizedCode = normalizeCode(code);

  if (!items.length) {
    return {
      items,
      subtotal,
      discountAmount: 0,
      promotion: null,
      message: ""
    };
  }

  if (normalizedCode) {
    const promotion = promotions.find((entry) => entry.code === normalizedCode);
    if (!promotion) {
      throw new Error(language === "en" ? "Promo code was not found." : "Kode promo tidak ditemukan.");
    }

    const result = await evaluatePromotion(promotion, {
      items,
      subtotal,
      outletSlug,
      member,
      language
    });

    if (!result.eligible) {
      throw new Error(result.reason);
    }

    return {
      items,
      subtotal,
      discountAmount: result.discountAmount,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue
      },
      message: language === "en" ? `${promotion.name} applied.` : `${promotion.name} diterapkan.`
    };
  }

  const autoPromotions = promotions.filter((entry) => entry.autoApply);
  let best = null;

  for (const promotion of autoPromotions) {
    const result = await evaluatePromotion(promotion, {
      items,
      subtotal,
      outletSlug,
      member,
      language
    });

    if (!result.eligible) continue;
    if (!best || result.discountAmount > best.discountAmount) {
      best = result;
    }
  }

  if (!best) {
    return {
      items,
      subtotal,
      discountAmount: 0,
      promotion: null,
      message: ""
    };
  }

  return {
    items,
    subtotal,
    discountAmount: best.discountAmount,
    promotion: {
      id: best.promotion.id,
      code: best.promotion.code,
      name: best.promotion.name,
      discountType: best.promotion.discountType,
      discountValue: best.promotion.discountValue
    },
    message: language === "en" ? `${best.promotion.name} applied.` : `${best.promotion.name} diterapkan.`
  };
}
