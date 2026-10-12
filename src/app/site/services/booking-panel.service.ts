import {Injectable, signal} from '@angular/core';

/** Dati con cui aprire la prenotazione (es. dalla scheda di una camera). */
export interface BookingPreset {
  roomId?: string;
}

/**
 * Apertura e chiusura del pannello di prenotazione, da qualunque punto
 * del sito (header, drawer, blocchi, schede camera).
 */
@Injectable({providedIn: 'root'})
export class BookingPanelService {
  readonly isOpen = signal(false);
  readonly preset = signal<BookingPreset | null>(null);

  open(preset: BookingPreset | null = null): void {
    this.preset.set(preset);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
