import { Injectable, computed, effect, inject } from '@angular/core';
import { StorageService } from './storage/storage.service';
import { OpenApiBuilderService } from './open-api-builder.service';
import { OpenApiImportService } from './open-api-import.service';

const CURRENT_SPEC_ID = 'current';

@Injectable({ providedIn: 'root' })
export class SpecPersistenceService {
  private readonly storage = inject(StorageService);
  private readonly builder = inject(OpenApiBuilderService);
  private readonly importer = inject(OpenApiImportService);

  readonly hasSavedSpec = computed(() => this.storage.currentSpec() !== null);

  constructor() {
    effect(() => {
      const spec = this.builder.spec();
      this.storage.saveSpec({
        id: CURRENT_SPEC_ID,
        spec,
        updatedAt: Date.now(),
        name: spec.info?.title || 'Untitled',
      });
    });
  }

  restoreSaved(): void {
    const entry = this.storage.currentSpec();
    if (!entry) return;
    try {
      this.importer.importFromString(JSON.stringify(entry.spec), 'spec.json');
    } catch (error) {
      console.warn('Error al restaurar spec guardada:', error);
    }
  }

  clearSaved(): Promise<void> {
    return this.storage.deleteSpec(CURRENT_SPEC_ID);
  }
}
