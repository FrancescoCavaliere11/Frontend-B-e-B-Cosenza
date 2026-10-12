import {HttpErrorResponse, HttpStatusCode} from '@angular/common/http';
import {errorMessageOf} from '../../security/interceptor';
import {UI} from '../i18n/it';

/** Errore del backend tradotto per la UI del sito. */
export interface SiteError {
  status: number;
  message: string;
  /** Secondi da attendere (header `Retry-After` dei 429). */
  retryAfter: number | null;
  /** Errori di validazione per campo (`details[].loc`, ultimo segmento). */
  fieldErrors: Readonly<Record<string, string>>;
}

const DEFAULT_RETRY_SECONDS = 60;

/**
 * Converte qualunque errore HTTP in un `SiteError`.
 *
 * Il messaggio del backend è già in italiano e mostrabile (`booking_api.md`
 * §1.4); per rete assente e 429 si usa un testo nostro, più utile.
 */
export function toSiteError(error: unknown): SiteError {
  if (!(error instanceof HttpErrorResponse)) {
    return {status: 0, message: UI.errors.generic, retryAfter: null, fieldErrors: {}};
  }

  if (error.status === 0) {
    return {status: 0, message: UI.errors.network, retryAfter: null, fieldErrors: {}};
  }

  if (error.status === HttpStatusCode.TooManyRequests) {
    const retryAfter = Number(error.headers.get('Retry-After')) || DEFAULT_RETRY_SECONDS;
    return {status: error.status, message: UI.errors.rateLimited(retryAfter), retryAfter, fieldErrors: {}};
  }

  const message = error.status >= HttpStatusCode.InternalServerError ? UI.errors.generic : errorMessageOf(error);
  return {status: error.status, message, retryAfter: null, fieldErrors: fieldErrorsOf(error)};
}

function fieldErrorsOf(error: HttpErrorResponse): Record<string, string> {
  const details: unknown = error.error?.details;
  if (!Array.isArray(details)) return {};

  const result: Record<string, string> = {};
  for (const detail of details) {
    const loc: unknown[] = Array.isArray(detail?.loc) ? detail.loc : [];
    const field = loc.length ? String(loc[loc.length - 1]) : '';
    if (field && typeof detail?.msg === 'string' && !(field in result)) {
      result[field] = detail.msg.replace(/^Value error, /, '');
    }
  }
  return result;
}
