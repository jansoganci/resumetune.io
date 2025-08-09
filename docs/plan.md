## Amaç ve Kapsam

Bu belge, mevcut MVP’yi üretime uygun, güvenli ve sürdürülebilir hale getirmek için yapılacak işleri adım adım tanımlar. Hedef: 2 kısa fazda (Faz 1 = güvenlik ve kırıcı hatalar; Faz 2 = doğrulama, UX ve ölçeklenebilirlik) toplam 12+ kritik konuyu çözmek ve ürünleşme temellerini atmak.

## Mimari Özet (Hafif ve MVP-uyumlu)

- **Frontend**: React + Vite + TypeScript (mevcut).
- **Backend (Serverless)**: Vercel Functions veya Cloudflare Workers üzerinden tek bir AI proxy + basit rate-limit. (Vercel örneğiyle ilerleyeceğiz.)
- **Veri**: Şimdilik tarayıcı `localStorage` (TTL ve maskleme ile). İhtiyaç halinde Supabase (kullanım logları/oturum) 2. sprint.
- **Analitik/İzleme**: GA4 (events), tercihen Sentry (opsiyonel) – Faz 2.

## Fazlar ve Zamanlama

- **Faz 1 (Gün 1)**: Güvenlik ve kırıcı bug’lar (12 maddenin 1–6’sı) + smoke test + preview deploy.
- **Faz 2 (Gün 2)**: Doğrulama/UX ve kalite (maddeler 7–12) + GA4 + küçük temizlik + preview.

---

## Görev Listesi (Detaylı)

### 1) API Anahtarı İstemciden Sunucuya (AI Proxy) — [DONE]
- **Sorun**: `VITE_GEMINI_API_KEY` istemci tarafında (sızma ve kötüye kullanım riski).
- **Çözüm**: Serverless endpoint `POST /api/ai/proxy` – istekleri Gemini API’ye ilerileyen güvenli vekil. Sunucu ortam değişkeni: `GEMINI_API_KEY`.
- **Frontend**:
  - `src/services/geminiService.ts` ve `src/services/ai/*Service.ts` içinde model kullanımını soyutlayıp tüm çağrıları `fetch('/api/ai/proxy')` üzerinden yap.
  - `src/config/gemini.ts` kaldır ya da sadece tip/adapter bırak.
- **Backend (Vercel function)**:
  - `api/ai/proxy.ts` (veya `api/ai/proxy.js`): body: `{ history, message, mode }` gibi; başlıkta `Authorization: Bearer ${process.env.GEMINI_API_KEY}` ile Gemini'a çağrı.
  - Basit **rate limit** (örn. IP başına dakikada X): in-memory (MVP) veya Upstash Redis (opsiyonel).
- **Güvenlik**:
  - Yalnızca gerekli alanları ilet; PII’yi loglama.
  - CORS: aynı origin veya çok sınırlı allowlist.
- **Kabul kriterleri**:
  - Frontend `.env`’de AI anahtarı yok.
  - Proxy üzerinden tüm AI akışları çalışıyor.

Örnek sunucu iskeleti:

```ts
// api/ai/proxy.ts (Vercel)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  try {
    // basic rate limit (MVP): key by IP
    // TODO (Faz 2): Upstash/Redis ile kalıcı limit

    const payload = req.body; // validate below in Faz 2
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/...:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: 'AI proxy failed' });
  }
}
```

### 2) PDF.js Worker’ı Yerelleştir (CSP/Offline Uyumu) — [DONE]
- **Sorun**: CDN’den worker – CSP ve offline sorunları.
- **Frontend**:
  - `src/utils/fileProcessor.ts` içinde worker tanımını local modül ile ayarla.
  - Vite uyumlu öneri:
    ```ts
    import * as pdfjsLib from 'pdfjs-dist';
    import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker as any;
    ```
- **Kabul kriterleri**:
  - PDF metin çıkarma offline çalışır, konsol uyarısı yok.

### 3) `FileUpload` Bozuk `useEffect` Fix — [DONE]
- **Sorun**: Yanlış tanımlı effect bloğu runtime hataya neden olabilir.
- **Frontend**:
  - `src/components/FileUpload.tsx` ilgili bloğu kaldır veya doğru `useEffect` olarak yaz:
    ```ts
    useEffect(() => {
      if (cvText.trim() && cvText.length > 50 && !currentFile) {
        // opsiyonel: otomatik işleme tetikleme kararı
      }
    }, [cvText, currentFile]);
    ```
- **Kabul kriterleri**: Uyarı/hata yok, yükleme akışı stabil.

### 4) `.doc` Kabul/İşleme Uyumsuzluğu — [DONE]
- **Sorun**: `.doc` kabul ediliyor; `mammoth` yalnızca `.docx` destekliyor.
- **Karar (MVP)**: `.doc` kabulünü kaldır. (Daha sonra sunucuda LibreOffice dönüştürme eklenebilir.)
- **Frontend**:
  - `FileUpload` accept listesinden `application/msword` çıkar.
  - Hata mesajını `.pdf`/`.docx` ile sınırla.
- **Kabul kriterleri**: `.doc` yüklenemez; açık rehberlik var.

### 5) PII Loglarını Kaldır / Dev Modda Sınırla — [DONE]
- **Sorun**: İsim/e‑posta/konum `console.log`’a yazılıyor.
- **Frontend**:
  - `src/services/ai/coverLetterService.ts` ve `src/utils/textUtils.ts` içindeki `console.log` satırlarını dev guard ile sar veya tamamen kaldır:
    ```ts
    if (import.meta.env.DEV) console.log('...');
    ```
- **Kabul kriterleri**: Prod’da PII logu yok.

### 6) Veri Bozan Regex’leri Kaldır — [DONE]
- **Sorun**: Gerçek üniversite/şirket adları generic kelimelere çevriliyor.
- **Frontend**:
  - `src/components/FileUpload.tsx` ve `src/utils/documentExport.ts` içindeki `replace(/...University Name/)` ve `Company Name` kalıplarını kaldır.
- **Kabul kriterleri**: Kurum adları korunur; encoding düzeltmeleri kalır.

### 7) AI Yanıt Doğrulama (JSON + Zod) — [DONE]
- **Sorun**: Kırılgan string arama (örn. `includes('yes, you should apply')`).
- **Çözüm**: JSON-only sözleşme + şema doğrulaması.
- **Frontend (JobMatch) — DONE**:
  - `src/services/ai/prompts/jobMatchPrompt.ts`: JSON-only talimat eklendi.
  - `src/services/ai/jobMatchService.ts`: `zod` ile şema doğrulama; code-fence ve metin dışı sarımlara karşı sanitizasyon.
- **Frontend (Cover Letter & Resume) — DONE**:
  - JSON-only talimat eklendi ve yanıt parse + sanitizasyon uygulandı (gerekirse Zod eklenebilir).
- **Backend**:
  - (Opsiyonel) Proxy tarafında mod tabanlı prompt kurgusu — Faz 2’ye bırakıldı.
- **Kabul kriterleri**: JobMatch akışı tip güvenli ve stabil — DONE; Cover/Resume — NEXT.
  - Tüm akışlar çalışır durumda — DONE.

### 8) Depolama Politikası: (Ertelendi)
- **Karar**: Şimdilik mevcut `localStorage` davranışı korunacak (TTL eklenmeyecek). İleride gerekirse TTL/şifreleme/maskeleme ele alınır.
- **Not**: “Clear all data” butonunun görünürlüğü korunur; mevcut `clearAllAppStorage` kullanılabilir.

### 9) i18n ve Doğrulama Kalıpları (EN/TR/ES/DE/ZH/KO/JA/AR) — [DONE]
- **Sorun**: `validateDocumentContent` İngilizce kalıplara bağlıydı; UI'da hard-coded metinler vardı.
- **Frontend**:
  - `i18next` modüler kurulum: `src/locales/{en,tr,es,de,zh,ko,ja,ar}/common.ts` oluşturuldu, tüm anahtarlar hizalandı.
  - `src/i18n.ts` yalnızca modülleri yükleyecek şekilde sadeleştirildi; `LanguageSwitcher` RTL (AR) desteği eklendi.
  - UI’daki sabit metinler `t()` ile değiştirildi: `App.tsx`, `ChatInterface.tsx`, `FileUpload.tsx`, `JobDescriptionInput.tsx`, `ProfileInput.tsx`, `ContactInfoInput.tsx`, `MatchResult.tsx`.
  - Uyarı/rehber alanları (AI disclaimer, How to use, Best Practice, Why Text Input Works Better, Source/Pasted label) i18n’e taşındı.
  - `validateDocumentContent`: TR selamlama/kapanış kalıpları eklendi (selamlama `Dear|Sayın|Merhaba`, kapanış `Sincerely|Saygılarımla|Sevgiler`).
- **Kabul kriterleri**: Çok dilli UI çalışıyor; TR/EN dahil tüm dillerde metinler mevcut; doğrulama TR’de de çalışıyor.

### 10) Hata Yönetimi Standardı — [DONE]
- **Sorun**: `alert` kullanımı ve dağınık hata mesajları.
- **Frontend**:
  - `components/ErrorBoundary.tsx` eklendi ve `main.tsx`’te tüm uygulama ağaçlarını sardı.
  - `components/ToastProvider.tsx` + `useToast()` global toast sistemi kuruldu; `clear()` eklendi.
  - `utils/errors.ts` altında `ErrorCode`, `AppError`, `mapUnknownError`, `handleApiError`, `reportError` eklendi.
  - `App.tsx` eski inline error UI kaldırıldı; tüm hatalar `toast` + i18n üzerinden gösteriliyor.
  - `ChatInterface`/export hataları `toast.error('errors.exportFailed')` ile standardize edildi.
- **Backend/Proxy**:
  - `server/dev-api.js` hata yanıtları `{ error: { code, message } }` formatına geçirildi.
- **Kabul kriterleri**: Tutarlı görsel hata; engelleyici `alert` yok; proxy/servis → UI hata akışı standardize. — DONE

### 11) Model ve Ayarlar (Stabil Sürüm) — [DONE]
- **Sorun**: `gemini-2.0-flash-exp` deneysel.
- **Çözüm**: Stabil bir modele geç (örn. `gemini-1.5-flash` veya iş kalitesine göre `1.5-pro`).
- **Frontend/Backend**:
  - Model adı konfigürasyona alın (env veya sabit). Güvenlik/safety parametreleri destekleniyorsa kapıda uygula (proxy tarafında).
- **Kabul kriterleri**: Daha öngörülebilir çıktı; token/latency kabul edilebilir.

### 12) Bağımlılık ve Tip Temizliği — [DONE]
- **Sorun**: Kullanılmayan/uygunsuz bağımlılıklar (`pdf-parse`, `git`), `any` kullanımı.
- **Frontend**:
  - `package.json`: Kullanılmayan bağımlılıklar kaldırıldı (`express`, `body-parser`, `pdf-parse`, `git`).
  - Servislerde `any` yerine açık tipler: `ResumeOptimizerService.resumeData` tiplendirildi.
- **Kabul kriterleri**: Build daha küçük; tip hataları erken yakalanır.

---

## Ek (Ürünleşme) – Faz 2+ (Opsiyonel ve Hızlı)

### A) GA4 ve Dönüşüm Olayları — [DONE]
- **Frontend**: GA4, GTM üzerinden yükleniyor (Measurement ID: `G-R2KKQRB75Z`). Event’ler: `generate_cover_letter`, `optimize_resume`, `export_pdf`, `export_docx`.
- **Primary Conversion**: `generate_cover_letter` GA4’te primary olarak işaretlendi — [DONE]
- **Google Ads Link**: GA4 ↔ Google Ads bağlantısı yapıldı — [DONE]

### B) Güvenlik Başlıkları / CSP (Statik) — [DONE]
- **Frontend**: `index.html` içine statik CSP meta eklendi (GA4, pdfjs-dist, dev HMR için toleranslı); `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` eklendi.

### C) Rate Limit Kalıcı Katman — [DONE (MVP)]
 - Admin kullanım görünümü: `GET /api/admin/usage?date=YYYY-MM-DD` — **[DONE]**
- **Dev Backend**: `server/dev-api.js` için dakika başı limit etkin (varsayılan 20 req/dak, 429 döner). `RATE_LIMIT_PER_MIN` ile ayarlanabilir.
- **Kabul kriterleri (MVP)**: Aşımda 429 ve tutarlı JSON hata: `{ error: { code: 'rate_limited', message: '...' } }`.

#### C‑prod (Backlog)
- **Prod Backend**: Vercel function `api/ai/proxy.js` + Upstash Redis ile kalıcı rate limit. Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_PER_MIN`.

### D) Sentry (opsiyonel) — [DONE]
### E) İş Modeli ve Pazar Stratejisi — [NEW]
- **Hedef Pazar Önceliği**: US → Asya → Orta Doğu → EU → Türkiye.
- **Model**: Hybrid (3 free/day + credits + monthly). Başlangıç fiyatları: Credits 50/$5, 200/$15; Subscription $12 (100 runs) / $19 (300 runs). A/B ile optimize edilecek — **[DONE/ONAYLANDI]**.
- **Primary Conversion (Ads/GA4)**: `generate_cover_letter` — **[DONE]**.
- **Free-limit Uygulaması (MVP)**: localStorage + IP‑bazlı soft kontrol; prod’da Upstash’la kuvvetlendirilecek.
- **Remarketing**: EEA için Consent Mode v2 aktif olmadan kişiselleştirilmiş reklamlar kapalı.

### F) Landing & SEO — [DONE]
 - JSON‑LD (FAQ/HowTo/WebApplication), meta/OG/Twitter etiketleri, preconnect (GTM/GA), footer'a `/pricing` linki eklendi — **[DONE]**
- **Landing**: Statik / (EN) — app `/app` altında kalır. IA: Paste Job + Paste CV + CTA; trust/örnekler; footer’da Pricing/Privacy/Terms/Imprint.
- **SEO (SSR’siz)**: JSON‑LD (FAQ/HowTo), canonical/OG, robots.txt + sitemap.xml, CWV hızlı kazanımlar.
- **CMP/Consent Mode v2**: Banner + GA4 consent güncellemeleri (MVP). Google‑certified CMP değerlendirmesi Sprint 2.

### G) Ödeme (Stripe) — [Backlog]
- **Kapsam**: Credit packs + subscription; SCA (Payment Intents) + webhooks; Stripe Tax. Kullanım defteri Redis üzerinde.

### H) Reklam Yerleşimi (AdSense) — [Backlog]
- **Durum**: Başvuru ve onay sonrası etkinleştirilecek. Script placeholder index.html’a eklendi.
- **CSP**: AdSense için script-src/connect-src/img-src/frame-src alanları genişletildi.
- **Gizlilik**: Privacy Policy’e AdSense notu eklendi; Consent Mode v2 ile uyumlu banner hazır.

### I) Google Ads Kampanyaları — [Backlog]
- **Yapılacaklar**: Search kampanyası (ad groups: "cover letter generator", "ai cover letter", "ats resume optimizer"), küçük Brand kampanyası.
- **Negatif Anahtar Kelimeler**: template, sample, HR/recruiter jobs vb.
- **Hedef Olay**: Primary conversion `generate_cover_letter` (GA4’te işaretli).

### J) Bütçe & Anahtar Kelimeler — [Backlog]
- **Günlük Bütçe**: başlangıç aralığı $20–$50 (A/B’ye göre güncellenecek).
- **Odak Anahtar Kelimeler**: en az 5 çekirdek keyword (örn. "ai cover letter generator", "ats resume optimizer").

## Sprint Planı (Revize)

### Sprint 1 (Ads‑ready, 5–7 gün)
- Statik landing (EN) + yasal sayfalar (privacy/terms/imprint)
- GA4 event’ler ve primary conversion: `generate_cover_letter`
- Consent Mode v2 banner (MVP) & legal linkler
- Upstash prod rate‑limit env’leri ve gövde boyutu sınırları
- Prod header’lar (vercel.json CSP/Referrer/Permissions)

### Z) Dokümantasyon Hijyeni — [DONE]
- `docs/plan.md` ve `README.md` sprint çıktılarıyla güncellendi; release checklist işaretlendi — **[DONE]**

### Sprint 2 (Monetization & Scale, 7–10 gün)
- Stripe (Payment Intents + webhooks; credits + monthly) + Stripe Tax
- Persistent Redis usage ledger + basit admin görünümü
- Opsiyonel SSR/prerender landing/marketing sayfaları; locale genişleme (ES/DE)
- Kampanya genişletme (US → APAC → MENA → EU → TR), PMax testi, remarketing (CMP sonrası)
- **Frontend**: `@sentry/react` eklendi, `src/utils/monitoring.ts` üzerinden init (DSN=`VITE_SENTRY_DSN`). `reportError()` → Sentry’ye de iletir. CSP `connect-src` Sentry ingest için genişletildi.

---

## Dosya/Dizin Bazlı Etki Matrisi

- `src/config/gemini.ts`: Kaldır/adaptere çevir (proxy sonrası doğrudan model erişimi olmayacak).
- `src/services/geminiService.ts`: Tüm AI çağrılarını proxy’ye yönlendir.
- `src/services/ai/*Service.ts`: Prompt/JSON şema uyumu; parse ve hata yönetimi.
- `src/services/ai/prompts/*.ts`: JSON-only (jobMatch), metin çıktısı net talimatlar (cover/resume).
- `src/components/FileUpload.tsx`: accept listesi ve bozuk `useEffect` düzeltmesi.
- `src/utils/fileProcessor.ts`: PDF worker local.
- `src/utils/textUtils.ts`: PII logları kaldır; TR doğrulama genişletmeleri.
- `src/utils/documentExport.ts`: Veri bozan regex’leri kaldır; hata yönetimi.
- `src/utils/storage.ts`: TTL yardımcıları; temizleme entegrasyonu.
- `package.json`: Bağımlılık temizlik.
- `api/ai/proxy.ts`: Yeni (Vercel function) – proxy + basit rate-limit.

---

## Test Planı (MVP)

- Birim test (minimal):
  - `utils/jobDescriptionParser.ts`: farklı ilan örnekleriyle başlık/şirket çıkarımı.
  - `utils/storage.ts`: TTL davranışı (geçerli/expired).
- Manuel smoke:
  - CV yükleme (.pdf, .docx) → metin çıkarma.
  - Job match → JSON parse → UI render.
  - Cover letter/resume → export PDF/DOCX.
  - “Clear all data” → tüm anahtarlar siliniyor.

---

## Rollback Planı

- Proxy sorununda: Eski doğrudan çağrı yolu kısa süreliğine geri alınabilir (sadece dev’de). Prod’da anahtarsız asla çalıştırma.
- Model değişimi: Konfigürasyonla anında eski modele dön.
- Paket temizlik: Versiyon bump → lockfile ile geri dönülebilir.

---

## Uygulama Sırası (Özet)

1. Proxy (1) → PDF worker (2) → FileUpload fix (3).
2. `.doc` uyumu (4) → PII logs (5) → Regex temizliği (6).
3. JSON şema/`zod` (7) → Storage TTL (8) → i18n/doğrulama (9).
4. Hata standardı (10) → Model stabilizasyonu (11) → Paket/tip temizliği (12).

Her adım tamamlandığında: kısa smoke test + preview deploy + notlar.


