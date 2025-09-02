// Phase 2 Assembler: Compose final cover letter from structured context + generated body
// This module is additive and not wired by default. Enhanced service will call it when the
// VITE_COVER_LETTER_PHASE2_PROMPT flag is enabled.

import type { CoverLetterContext } from '../../../types/coverLetter';
import { formatCoverLetterHeader, formatCoverLetterBody } from '../../../utils/textUtils';

function formatDate(dateISO: string, locale?: string): string {
  try {
    const d = new Date(dateISO || Date.now());
    return d.toLocaleDateString(locale || 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (_) {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

export function assembleCoverLetter(context: CoverLetterContext, body: string): string {
  const header = formatCoverLetterHeader(context.contact);
  const dateLine = formatDate(context.dateISO, context.locale);
  const company = context.company || 'Company Name';
  const position = context.position || 'Position';

  const formattedBody = formatCoverLetterBody(body || '');

  return `${header}

${dateLine}

${company}

Re: Application for ${position}

Dear Hiring Manager,

${formattedBody}

Sincerely,

${context.contact.fullName || 'Your Name'}`;
}

