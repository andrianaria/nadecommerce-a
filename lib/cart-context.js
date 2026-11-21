import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useStoreLanguage } from "@/lib/store-language";

const storageKey = "street-sushi-cart";
const CartContext = createContext(null);

function createLineId(productId, note) {
  return `${productId}::${note || ""}`;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const productId = String(item?.productId || "").trim();
      if (!productId) return null;
      const note = String(item?.note || "").trim();
      return {
        id: String(item?.id || createLineId(productId, note)),
        productId,
        quantity: Math.max(1, Number(item?.quantity || 1)),
        note
      };
    })
    .filter(Boolean);
}

export function CartProvider({ children }) {
  const { copy } = useStoreLanguage();
  const [items, setItems] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setItems(raw ? normalizeItems(JSON.parse(raw)) : []);
    } catch {
      setItems([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, isReady]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  function addItem(productId, quantity = 1, note = "", options = {}) {
    const nextNote = String(note || "").trim();
    const nextId = createLineId(productId, nextNote);
    const productName = String(options?.productName || "").trim();
    setItems((current) => {
      const existing = current.find((item) => item.id === nextId);

      if (existing) {
        return current.map((item) =>
          item.id === nextId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...current, { id: nextId, productId, quantity, note: nextNote }];
    });

    setToast({
      id: `${nextId}-${Date.now()}`,
      message: productName
        ? `${productName} ${copy.addedToCart}`
        : copy.addToCart
    });
  }

  function updateQuantity(itemId, quantity) {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }

  function updateNote(itemId, note) {
    const nextNote = String(note || "").trim();

    setItems((current) => {
      const target = current.find((item) => item.id === itemId);
      if (!target) return current;

      const nextId = createLineId(target.productId, nextNote);
      const existing = current.find((item) => item.id === nextId && item.id !== itemId);

      if (existing) {
        return current
          .filter((item) => item.id !== itemId && item.id !== existing.id)
          .concat({
            ...existing,
            id: nextId,
            note: nextNote,
            quantity: existing.quantity + target.quantity
          });
      }

      return current.map((item) =>
        item.id === itemId ? { ...item, id: nextId, note: nextNote } : item
      );
    });
  }

  function removeItem(itemId) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo(
    () => ({
      items,
      isReady,
      addItem,
      updateQuantity,
      updateNote,
      removeItem,
      clearCart,
      itemCount: items.reduce((total, item) => total + item.quantity, 0)
    }),
    [items, isReady]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="store-toast" role="status" aria-live="polite">
          <span className="store-toast__icon" aria-hidden="true">
            +
          </span>
          <span>{toast.message}</span>
        </div>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
