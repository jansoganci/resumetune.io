# project_status.md

## Güçlü Yanlar ve Eksikler

| Güçlü Yanlar | Eksikler |
| --- | --- |
| GTM + GA4 kurulu; primary conversion = `generate_cover_letter` aktif; GA4 ↔ Ads linkleme tamam | Google Ads kampanyaları (search/ad groups/negatives) henüz kurulmadı |
| Serverless AI proxy (Vercel) + Upstash ile IP rate limit, günlük kota, concurrency lock, timeout, origin/size kontrolleri | Kalıcı günlük kullanım ledger’ı için minimal admin okuma endpoint’i eksik |
| CSP/Referrer/Permissions Policy meta düzeyinde uygulanıyor; CookieYes CMP + Consent Mode v2 entegre | Üretimde tek kaynak CSP (vercel.json headers) + meta CSP sadeleştirme yapılmadı (çakışma riski) |
| Yasal sayfalar hazır ve /legal/* altında; sitemap + redirects eklendi | Global footer’da /legal/* linklerinin tutarlı yerleşimi (UI) gözden geçirilmeli |
| Çok dilli i18n, UI metinleri modülerleştirildi (EN/TR + diğerleri) | Programmatic SEO için 3–5 statik rehber sayfası yok |
| Hata yönetimi standardı (ErrorBoundary, Toast, AppError) tamam | /pricing sayfası (plan & CTA iskeleti) ve Stripe ödeme akışı henüz yok (Sprint 2) |
| Sentry entegrasyonu opsiyonel olarak hazır | AdSense başvurusu ve yerleşimler beklemede |

---

## İyileştirme Planı (Uygulanacak Sıra: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8)

### 1) Landing/SEO İyileştirmeleri
- Açıklama: Landing’i indekslenebilir, hızlı ve dönüşüm odaklı hale getir; JSON‑LD + CWV düzeltmeleri.
- Etkilenen katman: frontend, ui/ux
- Adımlar:
  1. index.html içine JSON‑LD ekle (FAQPage + HowTo + WebApplication).
  2. Meta/OG/Twitter etiketlerini sıkılaştır (title/description/canonical/og:image).
  3. CWV: preconnect (GTM/GA, gerekli 3. parti), non‑critical JS’leri defer, resimleri lazy‑load, hero’yu sıkıştır, CLS ve uzun task’ları düşür.
  4. İç linkler: footer’da `/legal/*` ve `/pricing` linkleri; crawl path sade.
  5. `public/sitemap.xml` güncel kaldığından emin ol.
  
  - [DONE] index.html meta/OG/Twitter + JSON-LD added
  
  #### Technical Implementation Details
  
  - JSON‑LD (inline scripts; minimal but valid examples)
  
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question","name": "How do I generate a cover letter?","acceptedAnswer": {"@type": "Answer","text": "Paste your job post and CV, click Check Job Match, then Generate Cover Letter."}},
      {"@type": "Question","name": "Do I need an account?","acceptedAnswer": {"@type": "Answer","text": "No account is required for the MVP; you get 3 free runs daily."}}
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to tailor a cover letter with ResumeTune",
    "step": [
      {"@type": "HowToStep","name": "Paste Job & CV"},
      {"@type": "HowToStep","name": "Check Job Match"},
      {"@type": "HowToStep","name": "Generate Cover Letter & Export"}
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ResumeTune",
    "url": "https://resumetune.io/",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any",
    "description": "AI-powered job matching, cover letter and resume optimization."
  }
  </script>
  ```
  
  - Meta/OG/Twitter (example)
  
  ```html
  <title>AI Cover Letter & Resume Optimizer | ResumeTune</title>
  <meta name="description" content="Paste your job post and CV to get an instant, tailored cover letter and ATS-ready resume improvements.">
  <link rel="canonical" href="https://resumetune.io/" />
  <meta property="og:type" content="website">
  <meta property="og:title" content="AI Cover Letter & Resume Optimizer | ResumeTune">
  <meta property="og:description" content="Paste job + CV → instant cover letter and ATS fixes. No login.">
  <meta property="og:url" content="https://resumetune.io/">
  <meta property="og:image" content="https://resumetune.io/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="AI Cover Letter & Resume Optimizer | ResumeTune">
  <meta name="twitter:description" content="Paste job + CV → instant cover letter and ATS fixes.">
  <meta name="twitter:image" content="https://resumetune.io/og-image.png">
  ```
  
  - CWV optimizations (checklist)
    - Preconnect targets:
      ```html
      <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
      <link rel="preconnect" href="https://www.google-analytics.com" crossorigin>
      ```
    - Preload hero image/font (if applicable); set explicit width/height to avoid CLS.
    - Defer non-critical JS; keep GTM as-first load.
    - Lazy-load images: `<img loading="lazy">`.
    - Compress hero image to WebP/AVIF; target < 100KB.
    - Reduce layout shifts: reserve space for banners/toasts, avoid dynamic height jumps.
    - Limit long tasks: avoid heavy sync work on load; split non-critical work with requestIdleCallback.
- Riskler/Bağımlılıklar:
  - JSON‑LD inline script CSP ile uyumlu; Lighthouse ile gerileme testi yap.

### 2) Ads/Measurement Entegrasyonları
- Açıklama: GTM/GA4 event haritasını finalize et; primary conversion güvenilir tetiklensin.
- Etkilenen katman: frontend, ui/ux
- Adımlar:
  1. GTM’de event map: `view_landing`, `start_analysis`, `job_match_done{score}`, `generate_cover_letter`(primary), `export_pdf/docx`, `pricing_view`, `select_plan{plan}`.
  2. UI eylemlerini dataLayer push’larına bağla; Consent Mode sonrası tetiklenecek şekilde koşullandır.
  3. GTM preview ile doğrula; GA4’te param/konversiyon sayımlarını kontrol et.
- Riskler/Bağımlılıklar:
  - CMP kategorileriyle tag’lerin eşleşmesi; çift tetiklemeyi önle.

 - [DONE] Design tokens consolidated in `src/styles/tokens.css` (colors/typography/spacing/radius/shadows/base)

### 3) Güvenlik Başlıkları (Production)
- Açıklama: Güvenlik başlıklarını vercel.json headers’a taşı; meta CSP ile mükerrerliği kaldır.
- Etkilenen katman: backend (deploy config)
- Adımlar:
  1. vercel.json’da headers: `Content-Security-Policy`, `Referrer-Policy=strict-origin-when-cross-origin`, `Permissions-Policy`(camera(), microphone(), geolocation() kapalı), `X-Content-Type-Options=nosniff`.
  2. CSP kaynakları: GTM/GA, CookieYes, Sentry, Ads/DoubleClick, Upstash; önce Preview’da test et.
  3. Doğrulama sonrası meta CSP’yi sadeleştir veya kaldır (tek kaynak vercel.json kalsın).
- Riskler/Bağımlılıklar:
  - Aşırı kısıtlı CSP GTM/CookieYes’i kırabilir; tarayıcı konsol/network ile test.

 - [DONE] Global base styles added in `src/styles/global.css` (imports tokens, base resets, link styles, typography spacing, scrollbars)

### 4) Rate Limit ve Günlük Kota Ledger (Kalıcı)
- Açıklama: Mevcut korumaları günlük kullanım ledger’ı ve minimal admin okuması ile kalıcılaştır.
- Etkilenen katman: backend, db (Upstash)
- Adımlar:
  1. `usage:{id}:{yyyy-mm-dd}` INCR, TTL 24h; soft limit aşımlarını logla.
  2. Sadece okuma endpoint’i: `GET /api/admin/usage?date=YYYY-MM-DD` (header token ile koru).
  3. `global:ai:count:{yyyy-mm-dd:HH}` sayacı için yumuşak bütçe uyarı hattı (Sentry warn).
- Riskler/Bağımlılıklar:
  - PII saklama: yalnızca anon‑id/IP‑hash; admin uç noktasını brute‑force’a karşı koru.

 - [DONE] Global styles imported in `src/main.tsx` so base tokens/styles apply app-wide

### 5) Monetization İskeleti (Stripe)
- Açıklama: /pricing + Stripe taslağı (şimdilik şarj yok; yapı hazır).
- Etkilenen katman: frontend, backend
- Adımlar:
  1. `/pricing`: Free 3/day; Credits 50/$5, 200/$15; Subs $12(100)/$19(300). CTA’lar “coming soon” veya disabled.
  2. Serverless taslak: `POST /api/stripe/create-checkout-session` (credits/subs), `POST /api/stripe/webhook` (signature verify); env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; client: `VITE_STRIPE_PUBLISHABLE_KEY`.
  3. Payment Intents + webhooks akışını README’de belgeleyip test modunda tut.
- Riskler/Bağımlılıklar:
  - SCA/webhook imza doğrulaması zorunlu; idempotency ve hız sınırlaması.

 - [DONE] /pricing statik sayfa ve Stripe API iskeleti eklendi (gerçek tahsilat yok)

### 6) Programmatic SEO (Başlangıç)
- Açıklama: 3–5 statik “Cover Letter for {Role}” sayfası yayınla.
- Etkilenen katman: frontend, seo
- Adımlar:
  1. `public/guides/`: `cover-letter-for-software-engineer.html`, `...product-manager.html`, `...data-analyst.html`.
  2. Her sayfa: özgün içerik + örnek + schema (FAQ/HowTo) + canonical/OG + ana uygulamaya iç link.
  3. `sitemap.xml`e ekleyip Search Console ile izleme.
- Riskler/Bağımlılıklar:
  - İnce/doorway içerikten kaçın; küçük setle başla, performansa göre artır.

 - [DONE] 5 statik rehber sayfası `public/content/` altında yayımlandı (SE, PM, Data Analyst, Marketing Manager, Graphic Designer); her sayfada özgün içerik, örnek, FAQ/HowTo schema, canonical/OG, ana sayfaya iç link mevcut; `public/sitemap.xml` güncellendi.

### 7) Legal/Consent UX Tune‑up
- Açıklama: CMP’yi GTM’den yönetecek şekilde sadeleştir; tek banner; /legal linkleri her sayfada.
- Etkilenen katman: frontend, ui/ux
- Adımlar:
  1. Global footer: `/legal/privacy-policy.html`, `/legal/terms-of-service.html`, `/legal/imprint.html`.
  2. CookieYes tag’lerini GTM’de kategorilere bağla; block‑before‑consent aktif.
  3. EEA simülasyonu ile ön‑consent izinsiz analytics/ads engellendi mi test et.
- Riskler/Bağımlılıklar:
  - CSP’de CookieYes domainleri (cdn-cookieyes.com, log.cookieyes.com) izinli (mevcut).

 - [DONE] Global footer + CMP (block-before-consent) doğrulandı (Footer tüm sayfalarda; Consent Mode v2 default denied; QA: EEA simülasyonu ile GA/Ads bloklandı → consent sonrası açıldı)

### 8) Dokümantasyon Hijyeni
- Açıklama: docs/plan.md ve README’yi güncel tut; release checklist belirgin olsun.
- Etkilenen katman: docs/process
- Adımlar:
  1. plan.md: Onaylı fiyatlar ve primary conversion [DONE] işli; Ads/AdSense/Bütçe [Backlog].
  2. README: Pricing kısa özet + env tabloları (Stripe, Upstash, Sentry).
  3. Release checklist: Vercel env’ler, Preview test, CSP/consent validation, redirects.

---