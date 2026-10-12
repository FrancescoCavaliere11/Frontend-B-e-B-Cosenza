import {Injectable, inject, signal} from '@angular/core';
import {SiteApiService} from '../http/site-api.service';
import {SERVICE_FALLBACK_MEDIA, SERVICES_CONTENT} from '../content/services.content';
import {ServiceItem} from '../models/site.models';
import {ExtraServiceSchema} from '../../schemas/extra-service-schema';
import {CatalogState} from './site-rooms.service';

const DEFAULT_NOTE = 'Su richiesta';

/**
 * Servizi extra: quelli del backend arricchiti con foto e note dei
 * contenuti (per nome), oppure i soli contenuti se il backend non ne ha.
 */
@Injectable({providedIn: 'root'})
export class SiteExtrasService {
  private readonly api = inject(SiteApiService);

  readonly items = signal<ReadonlyArray<ServiceItem>>(SERVICES_CONTENT);
  readonly state = signal<CatalogState>('idle');

  load(): void {
    if (this.state() !== 'idle') return;
    this.state.set('loading');
    this.api.getExtraServices().subscribe({
      next: services => {
        if (services.length) this.items.set(services.map((service, index) => this.toItem(service, index)));
        this.state.set('ready');
      },
      error: () => this.state.set('preview'),
    });
  }

  private toItem(service: ExtraServiceSchema, index: number): ServiceItem {
    const content = SERVICES_CONTENT.find(item => normalize(item.name) === normalize(service.name));
    return {
      name: service.name,
      description: service.description || content?.description || '',
      note: content?.note ?? DEFAULT_NOTE,
      media: content?.media ?? SERVICE_FALLBACK_MEDIA[index % SERVICE_FALLBACK_MEDIA.length],
    };
  }
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('it-IT');
}
