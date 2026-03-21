import { Injectable, signal } from '@angular/core';
import { StorageService, StoredSpecEntry } from './storage.service';

const STORAGE_KEY = 'oas_specs';

@Injectable()
export class LocalStorageService extends StorageService {
  readonly currentSpec = signal<StoredSpecEntry | null>(this.loadCurrent());
  readonly isLoading = signal(false);

  async saveSpec(entry: StoredSpecEntry): Promise<void> {
    try {
      const all = this.readAll();
      all[entry.id] = entry;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      this.currentSpec.set(entry);
    } catch (error) {
      console.warn('Error al guardar spec en localStorage:', error);
    }
  }

  async deleteSpec(id: string): Promise<void> {
    try {
      const all = this.readAll();
      delete all[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      this.currentSpec.set(null);
    } catch (error) {
      console.warn('Error al eliminar spec de localStorage:', error);
    }
  }

  private loadCurrent(): StoredSpecEntry | null {
    try {
      const all = this.readAll();
      return all['current'] ?? null;
    } catch (error) {
      console.warn('Error al leer spec desde localStorage:', error);
      return null;
    }
  }

  private readAll(): Record<string, StoredSpecEntry> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredSpecEntry>;
  }
}
