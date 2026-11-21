import { useEffect, useState } from "react";
import styles from "@/styles/Admin.module.css";

const defaultForm = {
  slug: "",
  code: "",
  name: "",
  shortLabel: "",
  address: "",
  city: "",
  province: "",
  latitude: "",
  longitude: "",
  keywords: "",
  isActive: true
};

function normalizeInitial(outlet) {
  if (!outlet) return defaultForm;
  return {
    slug: outlet.slug || "",
    code: outlet.code || "",
    name: outlet.name || "",
    shortLabel: outlet.shortLabel || "",
    address: outlet.address || "",
    city: outlet.city || "",
    province: outlet.province || "",
    latitude: outlet.latitude ?? "",
    longitude: outlet.longitude ?? "",
    keywords: Array.isArray(outlet.keywords) ? outlet.keywords.join(", ") : outlet.keywords || "",
    isActive: outlet.isActive !== false
  };
}

export default function OutletForm({
  initialOutlet,
  onSubmit,
  onCancel,
  submitLabel,
  busyLabel,
  setToast,
  status,
  setStatus
}) {
  const [form, setForm] = useState(() => normalizeInitial(initialOutlet));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(normalizeInitial(initialOutlet));
  }, [initialOutlet]);

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

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus?.("Menyimpan...");

    try {
      const payload = {
        ...form,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
        keywords: form.keywords
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
          Nama outlet
          <input name="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Nama singkat
          <input name="shortLabel" value={form.shortLabel} onChange={updateField} required />
        </label>
      </div>

      <div className={styles.duoFields}>
        <label>
          Slug
          <input name="slug" value={form.slug} onChange={updateField} required />
        </label>
        <label>
          Kode
          <input name="code" value={form.code} onChange={updateField} />
        </label>
      </div>

      <label>
        Alamat
        <textarea name="address" rows="3" value={form.address} onChange={updateField} required />
      </label>

      <div className={styles.duoFields}>
        <label>
          Kota
          <input name="city" value={form.city} onChange={updateField} />
        </label>
        <label>
          Provinsi
          <input name="province" value={form.province} onChange={updateField} />
        </label>
      </div>

      <div className={styles.duoFields}>
        <label>
          Latitude
          <input name="latitude" value={form.latitude} onChange={updateField} />
        </label>
        <label>
          Longitude
          <input name="longitude" value={form.longitude} onChange={updateField} />
        </label>
      </div>

      <label>
        Kata kunci
        <input
          name="keywords"
          value={form.keywords}
          onChange={updateField}
          placeholder="kata kunci, pisahkan, dengan, koma"
        />
      </label>

      <label className={styles.checkboxRow}>
        <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
        Outlet aktif
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

