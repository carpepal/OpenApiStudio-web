import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SearchResultViewModel } from '../../models/search.models';
import { SearchService } from '../../services/search.service';

const BADGE_COLORS: Record<string, string> = {
  schema:   'bg-purple-100 text-purple-700',
  path:     'bg-blue-100 text-blue-700',
  server:   'bg-green-100 text-green-700',
  tag:      'bg-yellow-100 text-yellow-700',
  security: 'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './search-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchModalComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  readonly isOpen = signal(false);
  readonly results = signal<SearchResultViewModel[]>([]);
  readonly hasSearched = signal(false);
  readonly badgeColors = BADGE_COLORS;
  queryText = '';

  private readonly querySubject = new Subject<string>();

  ngOnInit(): void {
    this.querySubject.pipe(
      debounceTime(2000),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(query => {
      this.results.set(this.searchService.search(query));
      this.hasSearched.set(true);
    });
  }

  open(): void {
    this.isOpen.set(true);
    this.queryText = '';
    this.results.set([]);
    this.hasSearched.set(false);
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 50);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onQueryChange(value: string): void {
    this.queryText = value;
    if (!value.trim()) {
      this.results.set([]);
      this.hasSearched.set(false);
      return;
    }
    this.querySubject.next(value);
  }

  navigateTo(result: SearchResultViewModel): void {
    this.router.navigate([result.route], { fragment: result.fragment });
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.close();
  }
}
