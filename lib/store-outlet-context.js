import { createContext, useContext, useEffect, useMemo, useState } from "react";

const storageKey = "street-sushi-storefront-outlet";
const StoreOutletContext = createContext(null);

export function StoreOutletProvider({ children }) {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletSlug, setSelectedOutletSlug] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await fetch("/api/storefront/outlets");
        const data = await response.json().catch(() => ({}));
        if (!isMounted) return;
        const nextOutlets = data.outlets || [];
        setOutlets(nextOutlets);

        const saved =
          typeof window !== "undefined" ? window.localStorage.getItem(storageKey) || "" : "";
        const validSaved = nextOutlets.some((outlet) => outlet.slug === saved);
        setSelectedOutletSlug(validSaved ? saved : nextOutlets[0]?.slug || "");
      } catch {
        if (!isMounted) return;
        setOutlets([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedOutletSlug || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, selectedOutletSlug);
  }, [selectedOutletSlug]);

  const selectedOutlet = useMemo(
    () => outlets.find((outlet) => outlet.slug === selectedOutletSlug) || outlets[0] || null,
    [outlets, selectedOutletSlug]
  );

  return (
    <StoreOutletContext.Provider
      value={{
        outlets,
        selectedOutlet,
        selectedOutletSlug,
        setSelectedOutletSlug,
        loading
      }}
    >
      {children}
    </StoreOutletContext.Provider>
  );
}

export function useStoreOutlet() {
  return useContext(StoreOutletContext);
}
