function extractJsonFromMessage(message) {
  const marker = "Lalamove request failed:";
  const text = String(message || "");
  const idx = text.indexOf(marker);
  if (idx === -1) return null;
  return text.slice(idx + marker.length).trim();
}

export function parseLalamoveError(error) {
  const message = String(error?.message || error || "");
  const jsonPart = extractJsonFromMessage(message);
  if (!jsonPart) {
    return { id: null, message, detail: null, raw: null };
  }

  try {
    const parsed = JSON.parse(jsonPart);
    const first = Array.isArray(parsed?.errors) ? parsed.errors[0] : null;
    return {
      id: first?.id || null,
      message: first?.message || message,
      detail: first?.detail || null,
      raw: parsed
    };
  } catch {
    return { id: null, message, detail: null, raw: jsonPart };
  }
}

export function formatLalamoveUserError(error) {
  const parsed = parseLalamoveError(error);

  if (parsed.id === "ERR_OUT_OF_SERVICE_AREA") {
    return {
      code: "out_of_service_area",
      message:
        "Maaf, lokasi pengiriman ini di luar area layanan Lalamove. Coba geser pin/alamat, atau hubungi CS untuk bantuan pengiriman.",
      parsed
    };
  }

  if (parsed.id === "ERR_INVALID_FIELD") {
    return {
      code: "invalid_field",
      message: "Data pengiriman belum valid. Mohon cek lagi detail alamat/nomor telepon.",
      parsed
    };
  }

  return {
    code: "lalamove_error",
    message: parsed.message || "Lalamove error.",
    parsed
  };
}

