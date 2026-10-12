import {Component, OnDestroy, OnInit, inject, output, signal} from '@angular/core';
import {INTRO_TIMING, SITE} from '../../config/site.config';
import {ScrollLockService} from '../../services/scroll-lock.service';

type IntroPhase = 'claim' | 'wordmark' | 'leaving';

const LOCK_OWNER = 'intro';

/**
 * Copertina iniziale della Home: il claim, poi il nome, poi la casa.
 * Una volta per sessione e mai con «riduci movimento» (lo decide il layout).
 * Un clic la salta.
 */
@Component({
  selector: 'site-intro',
  standalone: false,
  templateUrl: './site-intro.html',
  styleUrl: './site-intro.css',
  host: {
    '[attr.data-phase]': 'phase()',
    '(click)': 'skip()',
    '(document:keydown.escape)': 'skip()',
  },
})
export class SiteIntro implements OnInit, OnDestroy {
  readonly done = output<void>();

  protected readonly site = SITE;
  protected readonly phase = signal<IntroPhase>('claim');

  private readonly scrollLock = inject(ScrollLockService);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.scrollLock.lock(LOCK_OWNER);
    this.schedule(() => this.phase.set('wordmark'), INTRO_TIMING.claimVisible);
    this.schedule(() => this.leave(), INTRO_TIMING.claimVisible + INTRO_TIMING.wordmarkVisible);
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    this.scrollLock.unlock(LOCK_OWNER);
  }

  protected skip(): void {
    if (this.phase() !== 'leaving') this.leave();
  }

  private leave(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.phase.set('leaving');
    this.scrollLock.unlock(LOCK_OWNER);
    this.schedule(() => this.done.emit(), INTRO_TIMING.fadeOut);
  }

  private schedule(action: () => void, delay: number): void {
    this.timers.push(setTimeout(action, delay));
  }
}
