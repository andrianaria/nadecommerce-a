import { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Admin.module.css";

const defaultForm = {
  name: "",
  category: "Sushi Cake",
  price: "",
  serves: "",
  pieces: "",
  description: "",
  tagline: "",
  theme: "salmon-sunrise",
  spicyLevel: "Mild",
  featured: true,
  spotlight: false,
  items: "",
  imageUrls: [],
  availableOutletSlugs: [],
  coverImageUrl: "",
  videoUrl: "",
  deliverySize: "small"
};

const themeLabels = {
  "salmon-sunrise": "Salmon Sunrise",
  "mango-pop": "Mango Pop",
  "wasabi-burst": "Wasabi Burst",
  "night-market": "Night Market"
};

const spicyLabels = {
  Mild: "Mild",
  Medium: "Medium",
  Mixed: "Campur",
  Bold: "Pedas"
};

const deliverySizeLabels = {
  small: "Small (0.1)",
  medium: "Medium (1)",
  large: "Large (2)"
};

const outletPageSize = 10;

function normalizeInitial(product) {
  if (!product) return defaultForm;

  return {
    name: product.name || "",
    category: product.category || "Sushi Cake",
    price: product.price == null ? "" : String(product.price),
    serves: product.serves || "",
    pieces: product.pieces == null ? "" : String(product.pieces),
    description: product.description || "",
    tagline: product.tagline || "",
    theme: product.theme || "salmon-sunrise",
    spicyLevel: product.spicyLevel || "Mild",
    featured: Boolean(product.featured),
    spotlight: Boolean(product.spotlight),
    items: Array.isArray(product.items) ? product.items.join("\n") : product.items || "",
    imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls : [],
    availableOutletSlugs: Array.isArray(product.availableOutletSlugs)
      ? product.availableOutletSlugs
      : [],
    coverImageUrl: product.coverImageUrl || product.imageUrls?.[0] || "",
    videoUrl: product.videoUrl || "",
    deliverySize: product.deliverySize || "small"
  };
}

export default function ProductForm({
  initialProduct,
  categories,
  outlets,
  onSubmit,
  onCancel,
  submitLabel,
  busyLabel,
  toast,
  setToast,
  status,
  setStatus
}) {
  const [form, setForm] = useState(() => normalizeInitial(initialProduct));
  const [newCategory, setNewCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [outletSearch, setOutletSearch] = useState("");
  const [outletPage, setOutletPage] = useState(1);

  useEffect(() => {
    setForm(normalizeInitial(initialProduct));
  }, [initialProduct]);

  const categoryOptions = useMemo(() => {
    const values = new Set(["Sushi Cake", ...(categories || [])].filter(Boolean));
    if (form.category) values.add(form.category);
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [categories, form.category]);

  const filteredOutlets = useMemo(() => {
    const needle = outletSearch.trim().toLowerCase();
    return (outlets || []).filter((outlet) => {
      if (!needle) return true;
      return [outlet.shortLabel, outlet.name, outlet.slug, outlet.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [outletSearch, outlets]);

  const outletTotalPages = Math.max(1, Math.ceil(filteredOutlets.length / outletPageSize));

  const visibleOutlets = useMemo(() => {
    const safePage = Math.min(outletPage, outletTotalPages);
    const start = (safePage - 1) * outletPageSize;
    return filteredOutlets.slice(start, start + outletPageSize);
  }, [filteredOutlets, outletPage, outletTotalPages]);

  useEffect(() => {
    setOutletPage((current) => Math.min(current, outletTotalPages));
  }, [outletTotalPages]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function showToast(type, message) {
    setToast?.({ type, message });
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setStatus?.("Ketik nama kategori dulu.");
      showToast("error", "Ketik nama kategori dulu.");
      return;
    }
    setForm((current) => ({ ...current, category: trimmed }));
    setNewCategory("");
    setStatus?.(`Kategori "${trimmed}" ditambahkan.`);
    showToast("success", `Kategori "${trimmed}" ditambahkan.`);
  }

  function toggleOutlet(slug) {
    setForm((current) => {
      const exists = current.availableOutletSlugs.includes(slug);
      return {
        ...current,
        availableOutletSlugs: exists
          ? current.availableOutletSlugs.filter((entry) => entry !== slug)
          : [...current.availableOutletSlugs, slug]
      };
    });
  }

  function setAllOutlets() {
    setForm((current) => ({
      ...current,
      availableOutletSlugs: (outlets || []).map((outlet) => outlet.slug)
    }));
  }

  function clearOutlets() {
    setForm((current) => ({
      ...current,
      availableOutletSlugs: []
    }));
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadMedia(event) {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
    const videoFiles = selectedFiles.filter((file) => file.type.startsWith("video/"));
    const nextImageCount = form.imageUrls.length + imageFiles.length;
    const nextVideoCount = (form.videoUrl ? 1 : 0) + videoFiles.length;

    if (nextImageCount > 4) {
      setStatus?.("Maksimal 4 foto per produk.");
      showToast("error", "Maksimal 4 foto per produk.");
      event.target.value = "";
      return;
    }

    if (nextVideoCount > 1) {
      setStatus?.("Maksimal 1 video per produk.");
      showToast("error", "Maksimal 1 video per produk.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setStatus?.("Mengunggah media...");

    try {
      for (const file of selectedFiles) {
        const dataUrl = await fileToDataUrl(file);
        const kind = file.type.startsWith("video/") ? "video" : "image";

        const response = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, dataUrl })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Upload media gagal.");
        }

        setForm((current) => ({
          ...current,
          imageUrls:
            kind === "image"
              ? [...current.imageUrls, data.asset.url].slice(0, 4)
              : current.imageUrls,
          coverImageUrl:
            kind === "image" && !current.coverImageUrl ? data.asset.url : current.coverImageUrl,
          videoUrl: kind === "video" ? data.asset.url : current.videoUrl
        }));
      }

      setStatus?.("Media berhasil diunggah.");
      showToast("success", "Media berhasil diunggah.");
    } catch (error) {
      setStatus?.(error.message);
      showToast("error", error.message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(url) {
    setForm((current) => {
      const nextImages = current.imageUrls.filter((entry) => entry !== url);
      return {
        ...current,
        imageUrls: nextImages,
        coverImageUrl: current.coverImageUrl === url ? nextImages[0] || "" : current.coverImageUrl
      };
    });
  }

  function removeVideo() {
    setForm((current) => ({ ...current, videoUrl: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus?.("Menyimpan...");

    try {
      const payload = {
        ...form,
        price: Number(form.price || 0),
        pieces: Number(form.pieces || 0),
        items: form.items,
        imageUrls: form.imageUrls,
        coverImageUrl: form.coverImageUrl,
        videoUrl: form.videoUrl,
        spotlight: form.spotlight
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

      <label>
        Nama produk
        <input name="name" value={form.name} onChange={updateField} required />
      </label>

      <div className={styles.duoFields}>
        <label>
          Kategori
          <select name="category" value={form.category} onChange={updateField}>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tema visual
          <select name="theme" value={form.theme} onChange={updateField}>
            {Object.entries(themeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.categoryComposer}>
        <input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder="Tambah kategori baru"
        />
        <button type="button" className={styles.secondaryButton} onClick={addCategory}>
          Tambah
        </button>
      </div>

      <div className={styles.trioFields}>
        <label>
          Harga
          <input
            name="price"
            type="number"
            min="0"
            value={form.price}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Jumlah pcs
          <input
            name="pieces"
            type="number"
            min="0"
            value={form.pieces}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Porsi
          <input name="serves" value={form.serves} onChange={updateField} required />
        </label>
      </div>

      <div className={styles.duoFields}>
        <label>
          Tagline
          <input name="tagline" value={form.tagline} onChange={updateField} />
        </label>
        <label>
          Level pedas
          <select name="spicyLevel" value={form.spicyLevel} onChange={updateField}>
            {Object.entries(spicyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.duoFields}>
        <label>
          Ukuran pengiriman
          <select name="deliverySize" value={form.deliverySize} onChange={updateField}>
            {Object.entries(deliverySizeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bobot kendaraan
          <input
            value={deliverySizeLabels[form.deliverySize] || "Small (0.1)"}
            readOnly
            aria-readonly="true"
          />
        </label>
      </div>

      <label>
        Deskripsi
        <textarea name="description" rows="4" value={form.description} onChange={updateField} required />
      </label>

      <label>
        Isi / item produk
        <textarea
          name="items"
          rows="6"
          placeholder="Satu item per baris"
          value={form.items}
          onChange={updateField}
        />
      </label>

      <div className={styles.panelCard}>
        <div className={styles.toolbar}>
          <div>
            <h3 style={{ margin: 0 }}>Ketersediaan outlet</h3>
            <p className={styles.muted} style={{ margin: "6px 0 0" }}>
              Jika belum dipilih, produk akan dianggap tersedia di semua outlet.
            </p>
          </div>
          <div className={styles.tableActions}>
            <button type="button" className={styles.inlineLinkButton} onClick={setAllOutlets}>
              Pilih semua
            </button>
            <button type="button" className={styles.inlineDanger} onClick={clearOutlets}>
              Kosongkan
            </button>
          </div>
        </div>
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
            <strong>{form.availableOutletSlugs.length}</strong>
            <span>outlet dipilih</span>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: 56 }}>Pilih</th>
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
                        className={styles.compactCheckbox}
                        checked={form.availableOutletSlugs.includes(outlet.slug)}
                        onChange={() => toggleOutlet(outlet.slug)}
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

      <div className={styles.mediaCard}>
        <div>
          <h3>Foto dan video</h3>
          <p>
            Unggah maksimal 4 foto dan 1 video. Foto: JPG, PNG, WEBP maks 5MB per file. Video:
            MP4, WEBM, MOV maks 20MB.
          </p>
        </div>

        <label className={styles.uploadField}>
          Tambah media
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            onChange={uploadMedia}
            disabled={isUploading}
          />
        </label>

        {!!form.imageUrls.length && (
          <div className={styles.imagePreviewGrid}>
            {form.imageUrls.map((url) => (
              <div key={url} className={styles.mediaPreview}>
                <img src={url} alt="Preview upload produk" />
                <label className={styles.coverChoice}>
                  <input
                    type="radio"
                    name="coverImageUrl"
                    checked={form.coverImageUrl === url}
                    onChange={() => setForm((current) => ({ ...current, coverImageUrl: url }))}
                  />
                  Jadikan cover
                </label>
                <button type="button" onClick={() => removeImage(url)}>
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}

        {form.videoUrl && (
          <div className={styles.videoPreview}>
            <video src={form.videoUrl} controls preload="metadata" />
            <button type="button" onClick={removeVideo}>
              Hapus video
            </button>
          </div>
        )}
      </div>

      <label className={styles.checkboxRow}>
        <input name="featured" type="checkbox" checked={form.featured} onChange={updateField} />
        Tampilkan sebagai highlight di storefront
      </label>

      <label className={styles.checkboxRow}>
        <input name="spotlight" type="checkbox" checked={form.spotlight} onChange={updateField} />
        Jadikan spotlight di beranda
      </label>

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
