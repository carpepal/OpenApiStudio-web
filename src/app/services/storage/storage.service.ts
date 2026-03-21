import { Signal } from '@angular/core';
import { OpenApiSpec } from '../../models/open-api.models';

export interface StoredSpecEntry {
  id: string;
  spec: OpenApiSpec;
  updatedAt: number;
  name: string;
}

export abstract class StorageService {
  abstract readonly currentSpec: Signal<StoredSpecEntry | null>;
  abstract readonly isLoading: Signal<boolean>;
  abstract saveSpec(entry: StoredSpecEntry): Promise<void>;
  abstract deleteSpec(id: string): Promise<void>;
}
