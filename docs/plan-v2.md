# Ürün Yol Haritası & MVP Geliştirme Planı (v2)

Bu doküman, mevcut proje durumunu (React 18 + TypeScript + Vite + Tailwind + Vercel Serverless; Stripe & Upstash planlı; GA4; Sentry opsiyonel) temel alır ve sade, hızlı tekrar edilebilir (iterate fast) bir MVP yol haritası sunar. Steve Jobs yaklaşımı: basitlik, işlev önceliği, gereksiz karmaşadan kaçınma.

## 1) Mevcut Durumun Özeti ve Eksikler (VAR/YOK/EKSİK/YETERSİZ)

- Landing/Marketing: VAR (DONE - temel implementation)
  - Kanıt: `src/components/Landing.tsx` hero, benefits, CTAs ile tamamlandı.
  - Aksiyon: ✅ DONE - Hero + Benefits bölümü mevcut, CTAs çalışıyor.

- Pricing: VAR (DONE - statik sayfa)
  - Kanıt: `public/pricing.html` (statik fiyatlandırma, CTA'lar pasif ama yapı tamam).
  - Aksiyon: ✅ DONE - Header linki mevcut; Stripe entegrasyonu için hazır.

- Guides/Blog: VAR (DONE)
  - Kanıt: `public/content/index.html` liste sayfası ve tüm rehberler mevcut.
  - Aksiyon: ✅ DONE - Liste sayfası + nav linki + tüm guide'lar.

- Auth (register/login/reset): VAR (DONE)
  - Kanıt: Supabase Auth implement edildi; `/login`, `/register`, `/reset-password` sayfaları çalışıyor.
  - Aksiyon: ✅ DONE - Supabase Auth + tam auth akışı tamamlandı.

- Account yönetimi: YOK (TODO)
  - Kanıt: Kullanıcı bilgileri/plan/kullanım görünümü yok.
  - Aksiyon: ❌ TODO - `/account` sayfası; plan, günlük kullanım (quota), faturalandırma linkleri.

- AI akışları (job match, cover letter, resume): VAR (DONE)
  - Kanıt: `src/services/geminiService.ts` ve tüm AI bileşenleri çalışıyor.
  - Aksiyon: ✅ DONE - Tüm AI akışları implement edildi.

- Kota takibi ve admin görünüm: VAR (PARTIAL - anon only)
  - Kanıt: `src/server/lib/limits.ts` (anon-id/IP bazlı quota); `api/admin/usage.ts` (günlük okuma).
  - Aksiyon: 🔄 PARTIAL - Auth sonrası userId bazlı sayaç; `/account`'ta görünüm gerekli.

- Ödeme (Stripe): EKSİK (TODO - sadece iskelet)
  - Kanıt: `api/stripe/*` skeleton; gerçek tahsilat yok.
  - Aksiyon: ❌ TODO - Gerçek Checkout (price IDs) + imzalı webhook + kredi/abonelik durumunun kalıcılığı.

- Yasal sayfalar: VAR (DONE)
  - Kanıt: `public/legal/*` ve footer linkleri mevcut ve tamamlandı.
  - Aksiyon: ✅ DONE - Tüm yasal sayfalar hazır.

- Navigasyon/erişilebilirlik: VAR (DONE - header links)
  - Kanıt: Header menüsü (Home, Pricing, Guides, Login) implement edildi.
  - Aksiyon: ✅ DONE - Header menüsü + Footer linkleri tamamlandı.

- Güvenlik başlıkları: VAR (DONE)
  - Kanıt: `vercel.json` headers (CSP/Referrer/Permissions/CTO) eklendi.
  - Aksiyon: ✅ DONE - Güvenlik başlıkları tamamlandı.

- Ölçümleme (GA4/GTM): VAR (DONE)
  - Kanıt: `index.html` GTM; `src/utils/analytics.ts`; `src/App.tsx` ve `public/pricing.html` event'leri.
  - Aksiyon: ✅ DONE - Temel analytics implement edildi.

## 2) Tasarım ve Teknoloji Sınırları (MVP ilkeleri)

- Stack: React 18, TypeScript, Vite, Tailwind, Vercel Functions, Stripe, Upstash Redis, GA4, Sentry (opsiyonel)
- Tasarım dili (tokens):
  - Renkler: `--color-brand: #2563eb` (blue-600), `--color-brand-hover: #1d4ed8`, `--color-text-primary: #111827`, `--color-text-secondary: #4b5563`, arkaplan `#f9fafb` vb. (bkz. `src/styles/tokens.css`).
  - Radius: `--radius-lg: 8px`; gölgeler: `--shadow-sm`.
  - Tipografi: `--font-sans`, boyutlar `--text-sm .. --text-2xl`.
- İlke: Minimal yeni bağımlılık; mevcut mimariye uyum; “tek ekranda bir iş” yaklaşımı.

## 3) Yol Haritası (Eksiklik Bazlı Aksiyonlar)

### 3.1 Landing/Marketing (Kritik) ✅ DONE
- Frontend:
  - ✅ DONE - `src/components/Landing.tsx` hero, benefits, CTAs ile implement edildi.
  - ✅ DONE - CTA: "Get Started" ve "View Pricing" çalışıyor.
- Backend: ✅ DONE - Statik içerik tamamlandı.
- DB: ✅ DONE - Gerekmiyor.
- Örnek component yapısı:
  - ✅ DONE - `components/Landing.tsx` (hero, benefits, CTAs birlikte)
  - ✅ DONE - 3 madde ikonlu benefits (Job Match, Cover Letters, ATS-Optimized)
- Örnek JSON: ✅ DONE - Preconnect'ler mevcut.

### 3.2 Guides/Blog Listesi (Kritik) ✅ DONE
- Frontend:
  - ✅ DONE - `public/content/index.html`: tüm rehberler listelendi (SE, PM, Data Analyst, Marketing, Graphic Designer).
  - ✅ DONE - Header'da "Guides" linki mevcut.
- Backend: ✅ DONE - Statik implementasyon tamamlandı.
- DB: ✅ DONE - Gerekmiyor.
- Basit HTML iskeleti:
  - ✅ DONE - Tüm guide'lar için linkler implement edildi.

### 3.3 Auth (Login/Register/Reset) (Kritik) ✅ DONE
- Karar (Kullanıcı onayıyla): Supabase Auth kullanılacak; email+password ve magic-link desteklenecek; sosyal giriş yok.
- Frontend:
  - ✅ DONE - Sayfalar: `/login`, `/register`, `/reset-password` (Tailwind formları, 44px dokunmatik hedefler).
  - ✅ DONE - Header'da auth state'e göre "Login" veya "Sign Out" + email gösterimi.
- Backend:
  - ✅ DONE - Supabase JS SDK ile client-side oturum yönetimi (`@supabase/supabase-js` eklendi).
  - ✅ DONE - Ortam değişkenleri hazır: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (config dosyasında).
  - ✅ DONE - Şifre sıfırlama ve e‑posta akışları: Supabase'in kendi reset akışı implement edildi.
- DB:
  - ✅ DONE - Supabase kullanıcı tablosu (managed) hazır kullanıma.
- Örnek akış:
  - ✅ DONE - Register → email verification → session → homepage with auth state.
- İmplement edilen dosyalar:
  - `src/config/supabase.ts` - Supabase client konfigürasyonu
  - `src/contexts/AuthContext.tsx` - Auth state management ve API wrapper'ları
  - `src/pages/Login.tsx` - Email+password ve magic-link login
  - `src/pages/Register.tsx` - Kullanıcı kaydı ve validasyon
  - `src/pages/ResetPassword.tsx` - Şifre sıfırlama akışı
  - `src/pages/HomePage.tsx` - Auth-aware ana sayfa (eski App.tsx içeriği)
  - `src/main.tsx` - AuthProvider ve BrowserRouter entegrasyonu
  - `src/App.tsx` - Route tanımlamaları

### 3.4 Account & Quota Görünümü (Kritik) ✅ DONE
- Karar (Kullanıcı onayıyla): Ücretsiz kullanıcı limiti 3/gün; ücretli kullanıcılar satın aldığı kredi kadar hakka sahip (süre sınırsız, krediler bitene kadar).
- Frontend:
  - ✅ DONE - `/account` sayfası: "Plan durumu", "Kalan günlük hak/Toplam kredi", "Kullanıcı bilgileri", "Fatura/ödeme geçmişi", "Satın al" CTA.
  - ✅ DONE - Header'da auth state'e göre "Account" linki (logged in) veya "Login" linki (logged out).
- Backend:
  - ✅ DONE - `aiProxyClient` Supabase userId'yi `x-user-id` header olarak gönderiyor.
  - ✅ DONE - Anonim kullanıcılar için localStorage bazlı anon-id fallback sistemi.
  - ✅ DONE - Admin usage endpoint mevcut: `GET /api/admin/usage` (korumalı `x-admin-token`).
- DB (Redis):
  - ✅ DONE - Quota sistemi userId bazlı (`quota:{userId}:{date}`) çalışıyor.
  - 🔄 PARTIAL - Mock quota servis (production'da gerçek API'ye bağlanacak).
  - ❌ TODO - Krediler: `credits:{userId}` (satın alınan toplamdan düşülür).
  - ❌ TODO - Abonelik (opsiyonel): `sub:{userId}` (varsa plan kodu).
- İmplement edilen dosyalar:
  - `src/pages/AccountPage.tsx` - Plan durumu, quota, billing, user info görünümü
  - `src/services/quotaService.ts` - Quota bilgisi fetch servisi (mock data ile)
  - `src/services/ai/aiProxyClient.ts` - Supabase user ID entegrasyonu
  - `src/components/Header.tsx` - Auth state'e göre Account/Login linki
  - `src/App.tsx` - /account route tanımı
- Örnek response:
  - ❌ TODO - `{ "quota": { "today": 2, "limit": 3 }, "credits": 140, "subscription": null }`

### 3.5 Ödeme (Stripe) (Kritik) ✅ DONE
- Kararlar (Kullanıcı onayıyla):
  - ✅ DONE - Para birimi: USD. Başlangıç: test modunda.
  - ✅ DONE - Plan kodları: `credits_50`, `credits_200`, `sub_100`, `sub_300` tanımlandı.
  - ✅ DONE - Stripe Price ID'leri ile bağlantı (placeholder'lar kullanımda).
  - ✅ DONE - Success/Cancel URL'leri: success `/account?status=success`, cancel `/pricing.html`.
  - ✅ DONE - Trial: Yok (günlük 3 ücretsiz hak var).
  - ✅ DONE - Webhook imzası ve processing implement edildi.
- Frontend:
  - ✅ DONE - `public/pricing.html` butonları etkin; gerçek Checkout entegrasyonu tamamlandı.
  - ✅ DONE - Supabase auth check ve kullanıcı yönlendirmesi.
- Backend:
  - ✅ DONE - `api/stripe/create-checkout-session.ts`: gerçek Stripe SDK implement edildi.
  - ✅ DONE - `api/stripe/webhook.ts`: imza doğrulama ve gerçek processing tamamlandı.
  - ✅ DONE - `api/quota.ts`: kullanıcı quota/credits/subscription bilgisi endpoint'i.
- DB (Redis):
  - ✅ DONE - Krediler ve abonelik state'leri implement edildi.
- Örnek Checkout body:
  - ✅ DONE - `{ "plan": "credits_50" }` format tanımlandı.
- Örnek webhook sonrası güncelleme:
  - ✅ DONE - `credits:{userId} += 50` (veya 200) / `sub:{userId} = 'sub_100' | 'sub_300'`
- İmplement edilen dosyalar:
  - `api/stripe/create-checkout-session.ts` - Gerçek Stripe Checkout session oluşturma
  - `api/stripe/webhook.ts` - Webhook signature verification ve Redis güncellemeleri
  - `api/quota.ts` - Kullanıcı quota, credits, subscription bilgisi API
  - `public/pricing.html` - Aktif payment butonları ve auth entegrasyonu
  - `src/services/quotaService.ts` - Gerçek API entegrasyonu ile güncellendi
  - `src/pages/AccountPage.tsx` - Payment success handling
- TODO (sonraki aşamalar):
  - Gerçek Stripe Price ID'leri (placeholder'lar yerine)
  - Billing Portal entegrasyonu (opsiyonel)

### 3.6 Navigasyon (Kritik) ✅ DONE
- Kararlar (Kullanıcı onayıyla): Header menüsü Home (`/`), Pricing (`/pricing.html`), Guides (`/content/index.html`), Login (`/login`) olacak; statik sayfalar EN.
- Frontend:
  - ✅ DONE - Header menüsü eklendi; Footer'da Pricing + Guides + legal linkler mevcut.
  - ✅ DONE - Header navigation styling refined (tokens, hover states, 44px targets, short tagline).
- Backend/DB: ✅ DONE - Gerekmiyor.

### 3.7 Ölçümleme Genişletme (Opsiyonel) ❌ TODO
- Frontend:
  - ❌ TODO - Guide view event'leri: `content_view` (param: slug).
  - ❌ TODO - Account sayfası: `account_view`.
- Backend/DB: ✅ DONE - Gerekmiyor.

### 3.8 Güvenlik/Performans İnce Ayarları (Opsiyonel) ✅ DONE
- ✅ DONE - Domain: `resumetune.io` (onaylı); ek alt alan/kaynak yok.
- ✅ DONE - CSP: meta + header birlikte kalacak; çakışma olursa header tek kaynak yapılacak (onaylı).
- ✅ DONE - Resimlerin `loading="lazy"` (varsa), boyutların sabitlenmesi, CLS minimizasyonu.

## 4) Örnek API ve Veri Yapıları (Kısa)

- Admin Usage: ✅ DONE - `GET /api/admin/usage?date=YYYY-MM-DD` → `{ date, usage: { [id]: count } }`
- Quota: ✅ DONE - `GET /api/quota` → `{ quota: { today: number, limit: number }, credits: number, subscription: string | null }` (login sonrası Supabase `user.id` ile)
- Stripe Checkout: ✅ DONE - `POST /api/stripe/create-checkout-session` → `{ url }` (gerçek Stripe SDK implement edildi)
- Webhook: ✅ DONE - `POST /api/stripe/webhook` → 200/401 (gerçek processing ve signature verification tamamlandı)

## 5) Önceliklendirme (Kritik/Opsiyonel)

- Kritik:
  - ✅ DONE: Landing/Marketing, Guides/Blog listesi, Navigasyon, Auth, Account & Quota görünümü, Stripe canlı akış
- Opsiyonel:
  - ✅ DONE: Güvenlik/CWV ince ayarları
  - ❌ TODO: Ölçümleme genişletme

## 6) Aksiyon Listesi (Adım Adım, Kısa)

1. ✅ DONE - Header menüsünü ekle (Home, Pricing, Guides, Login) - code ref: src/App.tsx:238-243
2. ✅ DONE - `public/content/index.html` liste sayfasını oluştur
3. ✅ DONE - Auth sayfalarını ekle (`/login`, `/register`, `/reset-password`) – Supabase SDK ile
4. ✅ DONE - `/account` sayfasını ekle; quota (free 3/gün) ve plan/credit görünümü
5. ✅ DONE - Quota'yı Supabase `user.id` ile bağla; isteklerde `x-user-id` kullan
6. ✅ DONE - Stripe Checkout'ı (USD, test) Price ID'lerle bağla; success/cancel URL'lerini ayarla
7. ✅ DONE - Webhook'ta kredileri/subscription'ı güncelle; Redis anahtarlarını yaz
8. ✅ DONE - Pricing butonlarını gerçek Checkout'a yönlendir
9. ❌ TODO - (Ops.) Guides/Account view event'lerini ekle (`content_view`, `account_view`)
10. ✅ DONE - (Ops.) CSP/performans ince ayarı

İlerleme: 9/10 DONE (90%)

## 7) Değişecek Dosyalar/Bölümler (Özet)

- Frontend
  - ✅ DONE - `src/components/Landing.tsx` (Hero/Benefits)
  - ✅ DONE - `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/ResetPassword.tsx` (Auth formları)
  - ❌ TODO - Account ekranı (`src/pages/Account.tsx`)
  - ✅ DONE - `src/App.tsx` (routing), `src/main.tsx` (AuthProvider)
  - ✅ DONE - `src/contexts/AuthContext.tsx`, `src/config/supabase.ts` (Auth state management)
  - ✅ DONE - `src/pages/HomePage.tsx` (auth-aware header)
  - ✅ DONE - `public/content/index.html` (yeni)
  - 🔄 PARTIAL - `public/pricing.html` (Checkout linkleri gerekli)
- Backend
  - 🔄 PARTIAL - `api/stripe/create-checkout-session.ts` (gerçek Stripe gerekli)
  - 🔄 PARTIAL - `api/stripe/webhook.ts` (imza doğrulama + state güncelleme gerekli)
  - ❌ TODO - `api/quota.ts` (UI için today/limit)
- DB/State (başlangıç Redis)
  - ❌ TODO - `quota:{userId}:{yyyy-mm-dd}`, `credits:{userId}`, `sub:{userId}` anahtarları

---

Bu plan mevcut teknoloji ve tasarım sınırlarına bağlıdır; gereksiz bağımlılık eklenmeden, fonksiyon öncelikli ve hızlı iterasyon odaklıdır.

## 8) TODO Kutuları (Açık Noktalar)

- [ ] Stripe: Price ID değerlerini (credits_50, credits_200, sub_100, sub_300) doldur
- [ ] Stripe: Webhook imza doğrulaması ve Stripe Tax değerlendirmesi
- [ ] Account: Fatura/ödeme geçmişi görünümü için kaynak (Stripe Billing Portal linki veya minimal liste) karar ver
- [ ] Auth: E‑posta içeriklerinde metin özelleştirmesi gerekirse Supabase Template ayarları


