export type AnalyticsEvent =
  | 'generate_cover_letter'
  | 'generate_cover_letter_enhanced'
  | 'generate_cover_letter_fallback'
  | 'optimize_resume'
  | 'export_pdf'
  | 'export_docx'
  | 'start_analysis'
  | 'job_match_done';

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


