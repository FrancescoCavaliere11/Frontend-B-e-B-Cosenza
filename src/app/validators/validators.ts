import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

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
