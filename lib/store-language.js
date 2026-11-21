import { createContext, useContext, useEffect, useMemo, useState } from "react";

const storageKey = "street-sushi-language";
const LanguageContext = createContext(null);

export const storefrontCopy = {
  id: {
    language: "Pilih bahasa",
    chooseOutlet: "Pilih outlet",
    accountMenu: "Menu akun",
    profile: "Profil",
    orders: "Pesanan",
    selectedOutlet: "Outlet aktif",
    availableAt: "Tersedia di",
    unavailableAtOutlet: "Produk ini belum tersedia di outlet yang sedang dipilih.",
    noEligibleOutlet:
      "Belum ada satu outlet yang bisa memenuhi semua produk di keranjang ini. Silakan ubah isi keranjang atau hubungi CS.",
    trackingTitle: "Pesanan saya",
    trackingIntro: "Lihat riwayat order dan cek status terbaru pesanan kamu di sini.",
    orderReference: "Nomor pesanan",
    trackingLookup: "Cari pesanan",
    yourRecentOrders: "Pesanan kamu",
    noRecentOrders: "Belum ada pesanan yang bisa ditampilkan.",
    trackingHelp: "Halaman ini hanya tersedia untuk member yang sudah login.",
    trackingLoading: "Memuat pesanan...",
    trackingLoaded: "Pesanan berhasil dimuat.",
    trackingLoadFailed: "Gagal memuat pesanan.",
    orderPlacedDate: "Tanggal pemesanan",
    details: "Detail",
    open: "Buka",
    close: "Tutup",
    itemsLabel: "Item",
    orderStatus: "Status pesanan",
    paymentStatus: "Status pembayaran",
    deliveryStatus: "Status pengiriman",
    orderTotal: "Total pesanan",
    deliveryAddressLabel: "Alamat kirim",
    deliveryDateLabel: "Tanggal kirim",
    deliveryTimeLabel: "Jam kirim",
    driverInfoLabel: "Info driver",
    driverNameLabel: "Nama driver",
    driverPhoneLabel: "Nomor driver",
    driverPlateLabel: "Plat kendaraan",
    callDriver: "Hubungi driver",
    trackingLink: "Lacak pengiriman",
    memberProfileTitle: "Profil member",
    memberProfileIntro: "Data member dasar untuk mempermudah checkout dan melihat pesanan.",
    fullNameLabel: "Nama lengkap",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
    paymentSuccessTitle: "Pembayaran berhasil",
    paymentSuccessIntro: "Pesanan kamu sudah tercatat. Kalau kamu login sebagai member, riwayat dan status pesanan bisa langsung dilihat dari menu akun.",
    paymentFailedTitle: "Pembayaran belum selesai",
    paymentFailedIntro: "Pesanan kamu belum dibayar atau pembayaran belum berhasil. Kamu bisa kembali ke keranjang untuk coba lagi.",
    viewMyOrders: "Lihat pesanan saya",
    continueShopping: "Lanjut belanja",
    backToCart: "Kembali ke keranjang",
    loginToTrack: "Login untuk lihat pesanan",
    home: "Beranda",
    productsPackagesNav: "Produk & Paket",
    howToOrderNav: "Cara Pesan",
    faqNav: "FAQ",
    cart: "Keranjang",
    shopLabel: "Street Sushi Celebration Cakes",
    heroTop: "Sushi Cake",
    heroBottom: "yang bikin momen terasa lebih spesial.",
    lead:
      "Fun, halal, affordable, dan cocok untuk ulang tahun, traktiran kantor, atau kejutan kecil yang bikin hari terasa lebih meriah.",
    explore: "Lihat seri cake",
    facts: [
      "Sushi halal, enak dan ramah di kantong",
      "Cocok untuk surprise, office treat, dan celebration night",
      "Pilihan simpel untuk bikin momen terasa istimewa"
    ],
    spotlight: "Cake spotlight",
    sticker: "pas untuk surprise night",
    catalogEyebrow: "Seri Sushi Cake",
    catalogTitle: "Pilihan favorit untuk momen yang ingin terasa istimewa",
    orderSoon: "Pesan Sekarang",
    openCart: "Buka keranjang",
    memberLogin: "Login",
    memberSignup: "Daftar",
    memberHello: "Halo",
    memberLogout: "Keluar",
    memberAccount: "Akun member",
    addToCart: "Masukkan ke keranjang",
    viewCart: "Lihat Keranjang",
    addedToCart: "berhasil masuk ke keranjang.",
    quantity: "Jumlah",
    itemNote: "Catatan item",
    promoCode: "Kode promo",
    promoPlaceholder: "Masukkan kode promo",
    promoDiscount: "Diskon promo",
    promoApply: "Promo diterapkan",
    promoInvalid: "Promo tidak valid.",
    noNote: "Tidak ada catatan",
    lessSpicy: "Tidak pedas",
    productLabel: "Sushi Cake",
    cartTitle: "Keranjang belanja",
    cartReady: "item siap untuk checkout.",
    cartEmpty: "Keranjangmu masih kosong.",
    exploreCakes: "Lihat Sushi Cake",
    remove: "Hapus",
    orderSummary: "Ringkasan pesanan",
    subtotal: "Subtotal",
    deliveryFee: "Ongkir",
    deliveryLater: "Biaya pengiriman akan dikonfirmasi saat checkout.",
    checkingPromo: "Mengecek promo...",
    calculatingShipping: "Menghitung...",
    continueCheckout: "Lanjut ke checkout",
    checkoutTitle: "Checkout",
    fullName: "Nama lengkap",
    phone: "WhatsApp / nomor telepon",
    email: "Email",
    recipientName: "Nama Penerima",
    deliveryAddress: "Cari lokasi di peta",
    addressSearchPlaceholder: "Cari area, jalan, atau gedung lalu pilih dari saran",
    deliveryAddressDetail: "Detail alamat lengkap",
    deliveryAddressDetailPlaceholder:
      "Contoh: Blok B2 No. 7, lantai 2, dekat gerbang utama, rumah pagar hitam",
    deliveryAddressDetailHelper: "Detail alamat lengkap ini akan tampil di data penerima.",
    mapHelper: "Geser pin di peta supaya lokasi lebih akurat.",
    useMyLocation: "Gunakan lokasi saya",
    mapsKeyMissing: "Google Maps API key belum diisi. Pakai input alamat biasa dulu.",
    mapsLoadFailed: "Google Maps gagal dimuat.",
    browserNoLocation: "Browser tidak mendukung lokasi.",
    browserLocationFailed: "Tidak bisa mengambil lokasi. Pastikan izin lokasi aktif.",
    mapsNotEnabled: "Google Maps belum diaktifkan",
    locationPinRequired: "Silakan pilih alamat dari saran atau geser pin di peta sampai lokasi pengiriman terkunci.",
    deliveryQuoteRequired:
      "Ongkir belum berhasil dihitung. Tunggu sebentar sampai jenis kendaraan dan ongkir muncul, lalu coba lagi.",
    pinLabel: "Pin",
    pinNotSelected: "belum dipilih",
    recipientPhone: "Nomor telepon Penerima",
    cardMessage: "Ucapan di Kartu",
    fulfillmentType: "Pick up / Delivery",
    pickup: "Pick up",
    delivery: "Delivery",
    outlet: "Outlet",
    deliveryDate: "Tanggal Kirim",
    deliveryTime: "Jam Kirim",
    otherNote: "Other note",
    ordererName: "Nama Pemesan",
    ordererPhone: "Nomor WhatsApp Pemesan",
    outletHelper: "Outlet terdekat akan dipilih otomatis berdasarkan alamat kirim, lalu masih bisa kamu ubah.",
    notes: "Catatan pengiriman",
    notesPlaceholder: "Patokan alamat, jam kirim yang diinginkan, pesan ulang tahun, dan lainnya.",
    processing: "Memproses...",
    payWithXendit: "Bayar",
    creatingCheckout: "Membuat checkout...",
    checkoutFailed: "Checkout gagal.",
    checkoutSuccess: "berhasil dibuat.",
    asapHelp: "Butuh lebih cepat? Hubungi CS via WhatsApp",
    asapPrefix: "Halo saya mau pesan Sushi cake secepatnya apakah bisa?",
    whatsappOrderLabel: "Pesanan:",
    pb1: "PB1 10%",
    total: "Total",
    authLoginPageTitle: "Masuk Member",
    authLoginEyebrow: "Member Street Sushi",
    authLoginTitle: "Masuk dulu,",
    authLoginTitleAccent: "checkout sat-set.",
    authLoginLead:
      "Simpan data pesananmu agar proses order berikutnya lebih cepat, praktis, dan tidak perlu isi ulang dari awal.",
    authLoginHighlight: "Dapatkan info promo dan penawaran spesial!",
    authLoginCardTitle: "Masuk member",
    authLoginCardIntro: "Gunakan email atau nomor WhatsApp yang sudah terdaftar.",
    authIdentifierLabel: "Email / WhatsApp",
    authIdentifierPlaceholder: "contoh: support@example.com / 0812xxxx",
    authPasswordLabel: "Password",
    authPasswordPlaceholder: "Masukkan password",
    authForgotPassword: "Lupa password?",
    authProcessing: "Memproses...",
    authLoginAction: "Masuk",
    authNoAccount: "Belum punya akun?",
    authSignupLink: "Daftar member",
    authOr: "atau",
    authSignupPageTitle: "Daftar Member",
    authSignupEyebrow: "Join the party",
    authSignupTitle: "Jadi member untuk",
    authSignupTitleAccent: "checkout yang lebih simpel.",
    authSignupLead:
      "Cocok buat customer yang sering repeat order, kirim cake surprise, atau mau proses checkout lebih cepat tanpa isi ulang data terus-menerus.",
    authSignupBullet1: "Data member disimpan terpisah dan aman.",
    authSignupBullet2: "Nomor WhatsApp dipakai sebagai identitas customer utama.",
    authSignupBullet3: "Siap dihubungkan ke database customer franchisee saat akses DB dibuka.",
    authSignupCardTitle: "Daftar member",
    authSignupCardIntro: "Isi data dasar dulu. Setelah itu kamu langsung bisa checkout lebih cepat.",
    authPhoneLabel: "Nomor WhatsApp",
    authPhonePlaceholder: "0812xxxx",
    authFullNamePlaceholder: "Nama lengkap",
    authEmailPlaceholder: "support@example.com",
    authPasswordMinPlaceholder: "Minimal 6 karakter",
    authCreatingAccount: "Membuat akun...",
    authCreateAccountAction: "Buat akun member",
    authAccountCreated: "Akun member berhasil dibuat. Mengarahkan...",
    authHasAccount: "Sudah punya akun?",
    authLoginHere: "Masuk di sini",
    authForgotPageTitle: "Lupa Password",
    authForgotEyebrow: "Reset password member",
    authForgotTitle: "Lupa password?",
    authForgotTitleAccent: "Kami kirim link reset.",
    authForgotLead:
      "Masukkan email yang terdaftar di akun member Street Sushi. Nanti kamu akan menerima link untuk membuat password baru.",
    authForgotHighlight:
      "Link reset berlaku 30 menit dan hanya bisa dipakai untuk satu kali penggantian.",
    authForgotCardTitle: "Reset password",
    authForgotCardIntro: "Kami akan kirim link reset ke email yang kamu masukkan.",
    authSending: "Mengirim...",
    authSendResetLink: "Kirim link reset",
    authResetSent: "Cek email kamu untuk link reset password.",
    authRememberPassword: "Sudah ingat password?",
    authBackToLogin: "Kembali ke login",
    authResetPageTitle: "Password Baru",
    authResetEyebrow: "Password baru",
    authResetTitle: "Buat password baru",
    authResetTitleAccent: "untuk akun member kamu.",
    authResetLead:
      "Masukkan password baru minimal 6 karakter. Setelah berhasil, kamu bisa langsung login lagi dengan password yang baru.",
    authResetHighlight:
      "Setelah reset berhasil, link lama otomatis tidak bisa dipakai lagi.",
    authResetCardTitle: "Atur password baru",
    authResetCardIntro: "Gunakan password yang mudah kamu ingat tapi tetap aman.",
    authNewPasswordLabel: "Password baru",
    authConfirmPasswordLabel: "Konfirmasi password baru",
    authRepeatPasswordPlaceholder: "Ulangi password baru",
    authSaving: "Menyimpan...",
    authSavePasswordAction: "Simpan password baru",
    authPasswordUpdated: "Password berhasil diperbarui. Silakan login dengan password baru.",
    paidLabel: "Dibayar",
    pendingLabel: "Menunggu"
  },
  en: {
    language: "Language",
    chooseOutlet: "Choose outlet",
    accountMenu: "Account menu",
    profile: "Profile",
    orders: "Orders",
    selectedOutlet: "Active outlet",
    availableAt: "Available at",
    unavailableAtOutlet: "This product is not yet available at the currently selected outlet.",
    noEligibleOutlet:
      "There is no single outlet that can fulfill all products in this cart yet. Please adjust your cart or contact customer service.",
    trackingTitle: "My orders",
    trackingIntro: "See your order history and check the latest status here.",
    orderReference: "Order reference",
    trackingLookup: "Find order",
    yourRecentOrders: "Your orders",
    noRecentOrders: "No recent orders to show yet.",
    trackingHelp: "This page is available only for logged-in members.",
    trackingLoading: "Loading orders...",
    trackingLoaded: "Orders loaded successfully.",
    trackingLoadFailed: "Failed to load orders.",
    orderPlacedDate: "Order date",
    details: "Details",
    open: "Open",
    close: "Close",
    itemsLabel: "Items",
    orderStatus: "Order status",
    paymentStatus: "Payment status",
    deliveryStatus: "Delivery status",
    orderTotal: "Order total",
    deliveryAddressLabel: "Delivery address",
    deliveryDateLabel: "Delivery date",
    deliveryTimeLabel: "Delivery time",
    driverInfoLabel: "Driver info",
    driverNameLabel: "Driver name",
    driverPhoneLabel: "Driver phone",
    driverPlateLabel: "Vehicle plate",
    callDriver: "Contact driver",
    trackingLink: "Track delivery",
    memberProfileTitle: "Member profile",
    memberProfileIntro: "Basic member data to speed up checkout and make order tracking easier.",
    fullNameLabel: "Full name",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp",
    paymentSuccessTitle: "Payment successful",
    paymentSuccessIntro: "Your order has been recorded. If you are logged in as a member, you can view your order history and latest status from the account menu.",
    paymentFailedTitle: "Payment not completed",
    paymentFailedIntro: "Your order is not paid yet or the payment did not go through. You can go back to cart and try again.",
    viewMyOrders: "View my orders",
    continueShopping: "Continue shopping",
    backToCart: "Back to cart",
    loginToTrack: "Login to view orders",
    home: "Home",
    productsPackagesNav: "Products & Packages",
    howToOrderNav: "How to Order",
    faqNav: "FAQ",
    cart: "Cart",
    shopLabel: "Street Sushi Celebration Cakes",
    heroTop: "Sushi Cake",
    heroBottom: "made for moments that deserve a little celebration.",
    lead:
      "Fun, halal, affordable, and perfect for birthdays, office treats, or small surprises that make the day feel more special.",
    explore: "Explore the cake series",
    facts: [
      "Halal sushi with playful flavor and approachable prices",
      "Perfect for surprise nights, office treats, and celebrations",
      "An easy way to make everyday moments feel more special"
    ],
    spotlight: "Cake spotlight",
    sticker: "best for surprise night",
    catalogEyebrow: "Sushi Cake series",
    catalogTitle: "Favorite picks for moments worth making extra special",
    orderSoon: "Order Now",
    openCart: "Open cart",
    memberLogin: "Login",
    memberSignup: "Sign up",
    memberHello: "Hi",
    memberLogout: "Logout",
    memberAccount: "Member account",
    addToCart: "Add to cart",
    viewCart: "Go to cart",
    addedToCart: "added to cart.",
    quantity: "Quantity",
    itemNote: "Item note",
    promoCode: "Promo code",
    promoPlaceholder: "Enter promo code",
    promoDiscount: "Promo discount",
    promoApply: "Promotion applied",
    promoInvalid: "Promotion is invalid.",
    noNote: "No note",
    lessSpicy: "Not spicy",
    productLabel: "Sushi Cake",
    cartTitle: "Your cart",
    cartReady: "item(s) ready for checkout.",
    cartEmpty: "Your cart is still empty.",
    exploreCakes: "Explore Sushi Cake",
    remove: "Remove",
    orderSummary: "Order summary",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    deliveryLater: "Delivery fee will be confirmed during checkout.",
    checkingPromo: "Checking promo...",
    calculatingShipping: "Calculating...",
    continueCheckout: "Continue to checkout",
    checkoutTitle: "Checkout",
    fullName: "Full name",
    phone: "WhatsApp / phone",
    email: "Email",
    recipientName: "Recipient name",
    deliveryAddress: "Search location on map",
    addressSearchPlaceholder: "Search an area, street, or building and choose from suggestions",
    deliveryAddressDetail: "Full address details",
    deliveryAddressDetailPlaceholder:
      "Example: Block B2 No. 7, 2nd floor, near the main gate, black fence house",
    deliveryAddressDetailHelper: "These full address details will appear under the recipient address.",
    mapHelper: "Drag the pin on the map to make the location more accurate.",
    useMyLocation: "Use my location",
    mapsKeyMissing: "Google Maps API key is missing. Please use the regular address field for now.",
    mapsLoadFailed: "Google Maps failed to load.",
    browserNoLocation: "Your browser does not support location access.",
    browserLocationFailed: "We couldn't get your location. Please make sure location access is enabled.",
    mapsNotEnabled: "Google Maps is not enabled yet",
    locationPinRequired: "Please choose an address from the suggestions or move the pin on the map until the delivery location is locked in.",
    deliveryQuoteRequired:
      "Delivery fee has not been calculated yet. Please wait until the vehicle type and delivery fee appear, then try again.",
    pinLabel: "Pin",
    pinNotSelected: "not selected yet",
    recipientPhone: "Recipient phone number",
    cardMessage: "Card message",
    fulfillmentType: "Pick up / Delivery",
    pickup: "Pick up",
    delivery: "Delivery",
    outlet: "Outlet",
    deliveryDate: "Delivery date",
    deliveryTime: "Delivery time",
    otherNote: "Other note",
    ordererName: "Orderer name",
    ordererPhone: "Orderer WhatsApp / phone",
    outletHelper: "We auto-pick the nearest outlet from the delivery address, and you can still change it manually.",
    notes: "Delivery notes",
    notesPlaceholder: "Address notes, preferred delivery time, birthday message, etc.",
    processing: "Processing...",
    payWithXendit: "Pay",
    creatingCheckout: "Creating checkout...",
    checkoutFailed: "Checkout failed.",
    checkoutSuccess: "created successfully.",
    asapHelp: "Need it sooner? Contact CS on WhatsApp",
    asapPrefix: "Hi, I want to order Sushi Cake as soon as possible. Is that possible?",
    whatsappOrderLabel: "Order:",
    pb1: "PB1 10%",
    total: "Total",
    authLoginPageTitle: "Member Login",
    authLoginEyebrow: "Street Sushi Member",
    authLoginTitle: "Log in first,",
    authLoginTitleAccent: "then breeze through checkout.",
    authLoginLead:
      "Save your order details so your next checkout is faster, more practical, and doesn't need to be filled in again from scratch.",
    authLoginHighlight: "Get promo updates and special offers!",
    authLoginCardTitle: "Member login",
    authLoginCardIntro: "Use the email or WhatsApp number already registered on your account.",
    authIdentifierLabel: "Email / WhatsApp",
    authIdentifierPlaceholder: "example: support@example.com / 0812xxxx",
    authPasswordLabel: "Password",
    authPasswordPlaceholder: "Enter your password",
    authForgotPassword: "Forgot password?",
    authProcessing: "Processing...",
    authLoginAction: "Login",
    authNoAccount: "Don't have an account yet?",
    authSignupLink: "Sign up",
    authOr: "or",
    authSignupPageTitle: "Member Sign Up",
    authSignupEyebrow: "Join the party",
    authSignupTitle: "Become a member for",
    authSignupTitleAccent: "a smoother checkout.",
    authSignupLead:
      "Perfect for customers who reorder often, send surprise cakes, or want a faster checkout without re-entering their details every time.",
    authSignupBullet1: "Member data is stored separately and securely.",
    authSignupBullet2: "Your WhatsApp number is used as the main customer identity.",
    authSignupBullet3: "Ready to be linked to the franchisee customer database once DB access is enabled.",
    authSignupCardTitle: "Sign up",
    authSignupCardIntro: "Fill in the basic details first. After that, checkout will be much faster.",
    authPhoneLabel: "WhatsApp number",
    authPhonePlaceholder: "0812xxxx",
    authFullNamePlaceholder: "Full name",
    authEmailPlaceholder: "support@example.com",
    authPasswordMinPlaceholder: "Minimum 6 characters",
    authCreatingAccount: "Creating account...",
    authCreateAccountAction: "Create member account",
    authAccountCreated: "Member account created. Redirecting...",
    authHasAccount: "Already have an account?",
    authLoginHere: "Log in here",
    authForgotPageTitle: "Forgot Password",
    authForgotEyebrow: "Member password reset",
    authForgotTitle: "Forgot your password?",
    authForgotTitleAccent: "We'll send a reset link.",
    authForgotLead:
      "Enter the email registered on your Street Sushi member account. We'll send you a link to create a new password.",
    authForgotHighlight:
      "The reset link is valid for 30 minutes and can only be used once.",
    authForgotCardTitle: "Reset password",
    authForgotCardIntro: "We'll send a reset link to the email you enter.",
    authSending: "Sending...",
    authSendResetLink: "Send reset link",
    authResetSent: "Check your email for the password reset link.",
    authRememberPassword: "Remember your password now?",
    authBackToLogin: "Back to login",
    authResetPageTitle: "New Password",
    authResetEyebrow: "New password",
    authResetTitle: "Create a new password",
    authResetTitleAccent: "for your member account.",
    authResetLead:
      "Enter a new password with at least 6 characters. Once it's saved, you can log in again right away.",
    authResetHighlight:
      "Once reset is successful, the old link will stop working automatically.",
    authResetCardTitle: "Set new password",
    authResetCardIntro: "Use a password that's easy to remember but still secure.",
    authNewPasswordLabel: "New password",
    authConfirmPasswordLabel: "Confirm new password",
    authRepeatPasswordPlaceholder: "Repeat the new password",
    authSaving: "Saving...",
    authSavePasswordAction: "Save new password",
    authPasswordUpdated: "Password updated successfully. Please log in with your new password.",
    paidLabel: "Paid",
    pendingLabel: "Pending"
  }
};

export const productTranslations = {
  en: {
    "sushicake-chisai": {
      name: "Chisai",
      tagline: "Cute party starter",
      description:
        "A petite sushi cake for birthday surprises, quick celebrations, or comfort food that still feels a little fancy.",
      serves: "2-3 people",
      items: [
        "Salmon Mozza 8 pcs",
        "Firecracker Roll / Cheesy Salmon Roll 5 pcs",
        "Salmon Maki 8 pcs",
        "Spicy Tuna Maki 8 pcs"
      ]
    },
    "sushicake-kawaii": {
      name: "Kawaii",
      tagline: "Birthday energy boost",
      description:
        "The most playful pick for a sweet surprise, with a creamy, spicy, and crowd-pleasing combination.",
      serves: "2-3 people",
      items: [
        "Salmon Mozza 5 pcs",
        "Cheesy Salmon Roll 5 pcs",
        "Spicy Tuna Roll 5 pcs",
        "Spicy Tuna Maki 8 pcs",
        "Salmon Maki 8 pcs"
      ]
    },
    "sushicake-kofuku": {
      name: "Kofuku",
      tagline: "Party centerpiece",
      description:
        "A sushi cake made for sharing with the office, the family, or any celebration that needs a standout centerpiece.",
      serves: "5-6 people",
      items: [
        "Kani Tanuki Roll 8 pcs",
        "Salmon Mozza 8 pcs",
        "Cheesy Salmon Roll 8 pcs",
        "California Street Roll 8 pcs",
        "Tuna Mayo Maki 8 pcs",
        "Salmon Maki 8 pcs",
        "Tamago Maki 8 pcs",
        "Kani Maki 8 pcs"
      ]
    },
    "sushicake-oiwai": {
      name: "Oiwai",
      tagline: "Big celebration mode",
      description:
        "A premium choice that feels festive, bold, and perfect as the hero product for special occasions.",
      serves: "5-6 people",
      items: [
        "Hebi Roll 8 pcs",
        "Crispy Unagi Roll 8 pcs",
        "Cheesy Salmon Roll 8 pcs",
        "Spicy Tuna Maki 8 pcs",
        "Salmon Maki 8 pcs"
      ]
    }
  }
};

export function getLocalizedProduct(product, language) {
  if (!product || language === "id") {
    return product;
  }

  const translated = productTranslations[language]?.[product.id];

  if (!translated) {
    return product;
  }

  return {
    ...product,
    name: translated.name || product.name,
    tagline: translated.tagline || product.tagline,
    description: translated.description || product.description,
    serves: translated.serves || product.serves,
    items: translated.items || product.items
  };
}

export function StoreLanguageProvider({ children }) {
  const [language, setLanguage] = useState("id");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === "id" || raw === "en") {
        setLanguage(raw);
      }
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(storageKey, language);
  }, [isReady, language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      copy: storefrontCopy[language]
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useStoreLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useStoreLanguage must be used within StoreLanguageProvider.");
  }

  return context;
}
