import "@/styles/globals.css";
import { CartProvider } from "@/lib/cart-context";
import { MemberProvider } from "@/lib/member-context";
import { StoreOutletProvider } from "@/lib/store-outlet-context";
import { StoreLanguageProvider } from "@/lib/store-language";

export default function App({ Component, pageProps }) {
  return (
    <StoreLanguageProvider>
      <StoreOutletProvider>
        <MemberProvider>
          <CartProvider>
            <Component {...pageProps} />
          </CartProvider>
        </MemberProvider>
      </StoreOutletProvider>
    </StoreLanguageProvider>
  );
}
