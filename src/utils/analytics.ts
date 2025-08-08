export type AnalyticsEvent =
  | 'generate_cover_letter'
  | 'optimize_resume'
  | 'export_pdf'
  | 'export_docx';

export function trackEvent(eventName: AnalyticsEvent, params?: Record<string, any>) {
  try {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.gtag) {
      // @ts-ignore
      window.gtag('event', eventName, params || {});
    }
  } catch (_) {
    // no-op
  }
}


