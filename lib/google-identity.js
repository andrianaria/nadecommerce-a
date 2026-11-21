let googleIdentityPromise = null;

export function loadGoogleIdentity() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity hanya tersedia di browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleIdentityPromise) {
    return googleIdentityPromise;
  }

  googleIdentityPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("street-sushi-google-identity");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () =>
        reject(new Error("Gagal memuat Google Identity."))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "street-sushi-google-identity";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Gagal memuat Google Identity."));
    document.head.appendChild(script);
  });

  return googleIdentityPromise;
}
