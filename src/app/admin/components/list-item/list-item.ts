import {Component, ElementRef, effect, inject, input} from '@angular/core';
import {IconSvgObject} from '@hugeicons/angular';
import {Add01Icon} from '@hugeicons/core-free-icons';

/**
 * Prima di questo istante la pagina non è mai davvero ferma, anche se può
 * sembrarlo: la riga che si richiude torna alla sua altezza solo quando il
 * testo riprende la larghezza (`width .2s ease 1s` in list-item.css, quindi
 * fra 1 e 1,2 s). Fino ad allora quel testo sta in una colonna larga zero e la
 * riga resta alta e immobile: un controllo di stabilità scatterebbe lì, e la
 * riga aperta *sotto* risalirebbe subito dopo il centramento.
 */
const MIN_SETTLE_MS = 1250;
/** Fotogrammi consecutivi senza cambi di misura dopo cui la pagina è considerata ferma. */
const STABLE_FRAMES = 6;
/** Attesa massima prima di centrare comunque, anche se qualcosa si muove ancora. */
const MAX_SETTLE_MS = 2500;
/** Respiro sopra una riga più alta dell'area visibile, allineata in alto. */
const TOP_GAP_PX = 8;
/** Dopo quanto ricontrollare la posizione, a scorrimento finito. */
const RECHECK_AFTER_MS = 700;
/** Scarto oltre il quale la riga viene ricentrata. */
const RECHECK_TOLERANCE_PX = 4;

@Component({
  selector: 'app-list-item',
  standalone: false,
  templateUrl: './list-item.html',
  styleUrls: [
    './list-item.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/layout.css'
  ],
})
export class ListItem {
  title = input<string>();
  icon = input<IconSvgObject>();
  action= input<string>();
  isAddButton = input<boolean>(false)
  isOpen = input<boolean>(false)

  protected readonly Add01Icon = Add01Icon;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // A pannello aperto la riga viene portata al centro dell'area visibile.
    // Non a tempo fisso: mentre questa riga si apre, quella aperta prima si
    // richiude e la scheda finisce di caricarsi, e fino ad allora altezze e
    // posizioni cambiano. Si aspetta che la pagina sia ferma, poi si centra.
    effect(onCleanup => {
      if (!this.isOpen()) return;

      this.scrollPanelToTop();
      let recheck: ReturnType<typeof setTimeout> | undefined;
      const cancel = waitForStableLayout(() => this.row(), () => {
        this.centerInView();
        // Rete di sicurezza: se qualcosa si è mosso durante lo scorrimento
        // (un'animazione in ritardo, un browser che misura diversamente), la
        // riga viene ricentrata una volta.
        recheck = setTimeout(() => {
          if (Math.abs(this.offsetFromCenter()) > RECHECK_TOLERANCE_PX) this.centerInView();
        }, RECHECK_AFTER_MS);
      });
      onCleanup(() => {
        cancel();
        clearTimeout(recheck);
      });
    });
  }

  /**
   * Riporta all'inizio tutto ciò che scorre dentro il pannello (il pannello
   * stesso, il corpo dei form). Il contenuto resta nella pagina anche a riga
   * chiusa, per l'animazione di chiusura, e conserverebbe il punto in cui era
   * stato lasciato: riaprendo, la scheda partirebbe a metà, senza titolo.
   */
  private scrollPanelToTop(): void {
    const panel = this.host.nativeElement.querySelector<HTMLElement>('.form-wrapper');
    if (!panel) return;
    for (const element of [panel, ...Array.from(panel.querySelectorAll<HTMLElement>('*'))]) {
      if (element.scrollTop > 0) element.scrollTop = 0;
    }
  }

  /** Il riquadro della riga: `app-list-item` è inline e le sue misure non corrispondono a ciò che si vede. */
  private row(): HTMLElement {
    const host = this.host.nativeElement;
    return host.querySelector<HTMLElement>('.list-item-container') ?? host;
  }

  /**
   * Centra la riga nell'area visibile del contenitore che scorre, escludendo
   * la testata fissa dell'elenco che la coprirebbe. Una riga più alta
   * dell'area si allinea in alto, così titolo e chiusura restano visibili.
   */
  private centerInView(): void {
    const scroller = scrollParentOf(this.row());
    scroller?.scrollBy({
      top: this.offsetFromCenter(),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  /** Di quanto va fatta scorrere la pagina per avere la riga nella posizione voluta (0 = già lì). */
  private offsetFromCenter(): number {
    const row = this.row();
    const scroller = scrollParentOf(row);
    if (!scroller) return 0;

    const covered = stickyHeaderHeight(row);
    const visibleTop = scroller.getBoundingClientRect().top + covered;
    const visibleHeight = scroller.clientHeight - covered;
    const rowRect = row.getBoundingClientRect();

    return rowRect.height <= visibleHeight
      ? (rowRect.top + rowRect.height / 2) - (visibleTop + visibleHeight / 2)
      : rowRect.top - visibleTop - TOP_GAP_PX;
  }
}

/**
 * Chiama `onStable` quando, passato `MIN_SETTLE_MS`, la posizione e l'altezza
 * dell'elemento e l'altezza della pagina restano uguali per `STABLE_FRAMES`
 * fotogrammi; al più dopo `MAX_SETTLE_MS`. Restituisce la funzione che annulla l'attesa.
 */
function waitForStableLayout(target: () => HTMLElement, onStable: () => void): () => void {
  const startedAt = performance.now();
  let previous = '';
  let stableFrames = 0;
  let frame = requestAnimationFrame(function check(now) {
    const element = target();
    const rect = element.getBoundingClientRect();
    const scroller = scrollParentOf(element);
    const snapshot = `${rect.top}|${rect.height}|${scroller?.scrollHeight ?? 0}`;

    const elapsed = now - startedAt;
    // Prima di MIN_SETTLE_MS la stabilità non conta (vedi la costante).
    stableFrames = snapshot === previous && elapsed >= MIN_SETTLE_MS ? stableFrames + 1 : 0;
    previous = snapshot;

    if (stableFrames >= STABLE_FRAMES || elapsed >= MAX_SETTLE_MS) {
      onStable();
      return;
    }
    frame = requestAnimationFrame(check);
  });
  return () => cancelAnimationFrame(frame);
}

/** Il primo antenato che scorre davvero in verticale (nell'area admin, `.page`). */
function scrollParentOf(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const overflowY = getComputedStyle(parent).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
  }
  return document.scrollingElement as HTMLElement | null;
}

/**
 * Altezza della testata fissa dell'elenco (`.list-section > .header`, sticky
 * in layout.css), che copre la parte alta dell'area che scorre.
 */
function stickyHeaderHeight(row: HTMLElement): number {
  const header = row.closest('.list-section')?.querySelector<HTMLElement>(':scope > .header');
  return header?.getBoundingClientRect().height ?? 0;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
