let googleMapsPromise = null;

export function loadGoogleMaps({ apiKey, language = "id", region = "ID", libraries = ["places"] }) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only be loaded in the browser."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  if (!apiKey) {
    return Promise.reject(new Error("Missing Google Maps API key."));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("street-sushi-google-maps");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")));
      return;
    }

    const script = document.createElement("script");
    script.id = "street-sushi-google-maps";
    script.async = true;
    script.defer = true;

    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      language,
      region,
      libraries: Array.isArray(libraries) ? libraries.join(",") : String(libraries || "")
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps."));

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

