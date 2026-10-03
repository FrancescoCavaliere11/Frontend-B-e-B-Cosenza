import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {addDaysIso, nightsBetween, todayIso} from '../utils/booking-format';

/**
 * Controllo sintattico minimo di un indirizzo email (testo@dominio.tld): il
 * resto lo valida il backend (`EmailStr`). Più severo di `Validators.email`,
 * che accetta anche `nome@dominio` senza estensione.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const errors: ValidationErrors = {};

    if (!hasUpperCase) errors['missingUpperCase'] = true;
    if (!hasLowerCase) errors['missingLowerCase'] = true;
    if (!hasNumeric)   errors['missingNumeric'] = true;
    if (!hasSpecial)   errors['missingSpecial'] = true;

    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}

/**
 * Validatore di gruppo per un intervallo di date `YYYY-MM-DD`.
 *
 * Le date restano stringhe (formato dell'`<input type="date">` e del backend):
 * il confronto lessicografico su `YYYY-MM-DD` coincide con quello cronologico.
 * Se uno dei due estremi manca il controllo non si applica.
 *
 * @param fromKey nome del controllo con la data iniziale
 * @param toKey nome del controllo con la data finale
 * @param strict se true la data finale deve essere successiva (non uguale)
 * @returns `{ dateRange: true }` se l'intervallo è invertito
 */
export function dateRangeValidator(fromKey: string, toKey: string, strict = false): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const from: string | null = group.get(fromKey)?.value || null;
    const to: string | null = group.get(toKey)?.value || null;

    if (!from || !to) {
      return null;
    }

    const isInvalid = strict ? to <= from : to < from;
    return isInvalid ? { dateRange: true } : null;
  };
}

/** Regole di soggiorno controllate da `stayRulesValidator`. */
export interface StayRules {
  minNights: number;
  maxNights: number;
  maxAdvanceDays: number;
}

/**
 * Validatore di gruppo per un soggiorno: partenza dopo l'arrivo, notti fra
 * minimo e massimo, arrivo entro l'anticipo massimo da oggi (fuso della
 * struttura). Le date nel passato sono ammesse: il back-office può
 * registrare soggiorni già avvenuti.
 *
 * @returns `{ stay: 'order' | 'minNights' | 'maxNights' | 'advance' }`, il
 *   primo problema trovato, oppure `null`.
 */
export function stayRulesValidator(checkInKey: string, checkOutKey: string, rules: StayRules): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const checkIn: string | null = group.get(checkInKey)?.value || null;
    const checkOut: string | null = group.get(checkOutKey)?.value || null;
    if (!checkIn || !checkOut) return null;

    if (checkOut <= checkIn) return {stay: 'order'};

    const nights = nightsBetween(checkIn, checkOut);
    if (nights < rules.minNights) return {stay: 'minNights'};
    if (nights > rules.maxNights) return {stay: 'maxNights'};

    if (checkIn > addDaysIso(todayIso(), rules.maxAdvanceDays)) return {stay: 'advance'};
    return null;
  };
}
