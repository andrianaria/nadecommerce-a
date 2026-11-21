import { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Admin.module.css";

const defaultForm = {
  code: "",
  name: "",
  description: "",
  eligibilityScope: "all",
  discountType: "fixed",
  discountValue: "",
  maxDiscount: "",
  minSubtotal: "",
  autoApply: false,
  isActive: true,
  startsAt: "",
  endsAt: "",
  productSlugs: [],
  outletSlugs: []
};

function toDateTimeLocal(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function normalizeInitial(promotion) {
  if (!promotion) return defaultForm;
  return {
    code: promotion.code || "",
    name: promotion.name || "",
    description: promotion.description || "",
    eligibilityScope: promotion.eligibilityScope || "all",
    discountType: promotion.discountType || "fixed",
    discountValue: promotion.discountValue ?? "",
    maxDiscount: promotion.maxDiscount ?? "",
    minSubtotal: promotion.minSubtotal ?? "",
    autoApply: Boolean(promotion.autoApply),
    isActive: promotion.isActive !== false,
    startsAt: toDateTimeLocal(promotion.startsAt),
    endsAt: toDateTimeLocal(promotion.endsAt),
    productSlugs: Array.isArray(promotion.productSlugs) ? promotion.productSlugs : [],
    outletSlugs: Array.isArray(promotion.outletSlugs) ? promotion.outletSlugs : []
  };
}

const productPageSize = 8;
const outletPageSize = 8;

function clampPage(page, totalPages) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export default function PromotionForm({
  initialPromotion,
  products,
  outlets,
  onSubmit,
  onCancel,
  submitLabel,
  busyLabel,
  setToast,
  status,
  setStatus
}) {
  const [form, setForm] = useState(() => normalizeInitial(initialPromotion));
  const [isSaving, setIsSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [outletSearch, setOutletSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [outletPage, setOutletPage] = useState(1);

  useEffect(() => {
    setForm(normalizeInitial(initialPromotion));
  }, [initialPromotion]);

  const filteredProducts = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();
    return (products || []).filter((product) => {
      if (!needle) return true;
      return [product.name, product.category, product.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [productSearch, products]);

  const filteredOutlets = useMemo(() => {
    const needle = outletSearch.trim().toLowerCase();
    return (outlets || []).filter((outlet) => {
      if (!needle) return true;
      return [outlet.shortLabel, outlet.name, outlet.slug, outlet.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [outletSearch, outlets]);

  const productTotalPages = Math.max(1, Math.ceil(filteredProducts.length / productPageSize));
  const outletTotalPages = Math.max(1, Math.ceil(filteredOutlets.length / outletPageSize));

  const visibleProducts = useMemo(() => {
    const safePage = clampPage(productPage, productTotalPages);
    const start = (safePage - 1) * productPageSize;
    return filteredProducts.slice(start, start + productPageSize);
  }, [filteredProducts, productPage, productTotalPages]);

  const visibleOutlets = useMemo(() => {
    const safePage = clampPage(outletPage, outletTotalPages);
    const start = (safePage - 1) * outletPageSize;
    return filteredOutlets.slice(start, start + outletPageSize);
  }, [filteredOutlets, outletPage, outletTotalPages]);

  useEffect(() => {
    setProductPage((current) => clampPage(current, productTotalPages));
  }, [productTotalPages]);

  useEffect(() => {
    setOutletPage((current) => clampPage(current, outletTotalPages));
  }, [outletTotalPages]);

  function showToast(type, message) {
    setToast?.({ type, message });
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function toggleCollection(field, value) {
    setForm((current) => {
      const values = new Set(current[field] || []);
      if (values.has(value)) {
        values.delete(value);
      } else {
        values.add(value);
      }

      return {
        ...current,
        [field]: Array.from(values)
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus?.("Menyimpan promosi...");

    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue || 0),
        maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount || 0),
        minSubtotal: Number(form.minSubtotal || 0)
      };
      const result = await onSubmit(payload);
      if (result?.message) {
        setStatus?.(result.message);
        showToast("success", result.message);
      }
    } catch (error) {
      setStatus?.(error.message);
      showToast("error", error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      {status ? <p className={styles.formStatus}>{status}</p> : null}

      <div className={styles.duoFields}>
        <label>
          Nama promosi
          <input name="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Kode promo
          <input
            name="code"
            value={form.code}
            onChange={updateField}
            placeholder="Contoh: MEMBERBARU"
          />
        </label>
      </div>

      <label>
        Deskripsi
        <textarea name="description" rows="3" value={form.description} onChange={updateField} />
      </label>

      <div className={styles.trioFields}>
        <label>
          Tipe diskon
          <select name="discountType" value={form.discountType} onChange={updateField}>
            <option value="fixed">Nominal</option>
            <option value="percentage">Persentase</option>
          </select>
        </label>
        <label>
          Nilai diskon
          <input
            type="number"
            name="discountValue"
            value={form.discountValue}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Maks diskon
          <input
            type="number"
            name="maxDiscount"
            value={form.maxDiscount}
            onChange={updateField}
            placeholder="Kosongkan bila tidak ada"
          />
        </label>
      </div>

      <div className={styles.trioFields}>
        <label>
          Berlaku untuk
          <select name="eligibilityScope" value={form.eligibilityScope} onChange={updateField}>
            <option value="all">Semua customer</option>
            <option value="member">Hanya member</option>
            <option value="first_order_member">Member pesanan pertama</option>
          </select>
        </label>
        <label>
          Minimum subtotal
          <input
            type="number"
            name="minSubtotal"
            value={form.minSubtotal}
            onChange={updateField}
          />
        </label>
        <label>
          Mulai
          <input type="datetime-local" name="startsAt" value={form.startsAt} onChange={updateField} />
        </label>
      </div>

      <div className={styles.duoFields}>
        <label>
          Berakhir
          <input type="datetime-local" name="endsAt" value={form.endsAt} onChange={updateField} />
        </label>
      </div>

      <div className={styles.duoFields}>
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="autoApply" checked={form.autoApply} onChange={updateField} />
          Auto apply bila memenuhi syarat
        </label>
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
          Promosi aktif
        </label>
      </div>

      <div className={styles.panelCard}>
        <h2>Produk yang ikut promo</h2>
        <p className={styles.muted}>Kosongkan jika promo berlaku untuk semua produk.</p>
        <div className={styles.selectorHeader}>
          <label className={styles.filterField}>
            <span>Cari produk</span>
            <input
              value={productSearch}
              onChange={(event) => {
                setProductSearch(event.target.value);
                setProductPage(1);
              }}
              placeholder="Nama, kategori, atau slug produk"
            />
          </label>
          <div className={styles.selectorMeta}>
            <strong>{form.productSlugs.length}</strong>
            <span>produk dipilih</span>
          </div>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: 64 }}>Pilih</th>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.length ? (
                visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={form.productSlugs.includes(product.id)}
                        onChange={() => toggleCollection("productSlugs", product.id)}
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category || "-"}</td>
                    <td className={styles.monoCell}>{product.id}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    Produk tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.selectorFooter}>
          <span className={styles.muted}>
            Menampilkan {(productPage - 1) * productPageSize + (visibleProducts.length ? 1 : 0)}-
            {(productPage - 1) * productPageSize + visibleProducts.length} dari {filteredProducts.length} produk
          </span>
          <div className={styles.selectorPager}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setProductPage((current) => Math.max(1, current - 1))}
              disabled={productPage <= 1}
            >
              Sebelumnya
            </button>
            <span>Halaman {productPage} / {productTotalPages}</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setProductPage((current) => Math.min(productTotalPages, current + 1))}
              disabled={productPage >= productTotalPages}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      <div className={styles.panelCard}>
        <h2>Outlet yang ikut promo</h2>
        <p className={styles.muted}>Kosongkan jika promo berlaku di semua outlet.</p>
        <div className={styles.selectorHeader}>
          <label className={styles.filterField}>
            <span>Cari outlet</span>
            <input
              value={outletSearch}
              onChange={(event) => {
                setOutletSearch(event.target.value);
                setOutletPage(1);
              }}
              placeholder="Nama, kota, atau slug outlet"
            />
          </label>
          <div className={styles.selectorMeta}>
            <strong>{form.outletSlugs.length}</strong>
            <span>outlet dipilih</span>
          </div>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: 64 }}>Pilih</th>
                <th>Outlet</th>
                <th>Kota</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {visibleOutlets.length ? (
                visibleOutlets.map((outlet) => (
                  <tr key={outlet.slug}>
                    <td>
                      <input
                        type="checkbox"
                        checked={form.outletSlugs.includes(outlet.slug)}
                        onChange={() => toggleCollection("outletSlugs", outlet.slug)}
                      />
                    </td>
                    <td>{outlet.shortLabel || outlet.name}</td>
                    <td>{outlet.city || "-"}</td>
                    <td className={styles.monoCell}>{outlet.slug}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    Outlet tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.selectorFooter}>
          <span className={styles.muted}>
            Menampilkan {(outletPage - 1) * outletPageSize + (visibleOutlets.length ? 1 : 0)}-
            {(outletPage - 1) * outletPageSize + visibleOutlets.length} dari {filteredOutlets.length} outlet
          </span>
          <div className={styles.selectorPager}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setOutletPage((current) => Math.max(1, current - 1))}
              disabled={outletPage <= 1}
            >
              Sebelumnya
            </button>
            <span>Halaman {outletPage} / {outletTotalPages}</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setOutletPage((current) => Math.min(outletTotalPages, current + 1))}
              disabled={outletPage >= outletTotalPages}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      <div className={styles.formFooter}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Batal
        </button>
        <button type="submit" disabled={isSaving}>
          {isSaving ? busyLabel || "Menyimpan..." : submitLabel || "Simpan"}
        </button>
      </div>
    </form>
  );
}
