import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ScrollingModule,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  fromEvent,
} from 'rxjs';
import { UserService } from '../services/user.service';
import { User, SortConfig } from '../models/user.model';
import { HighlightPipe } from '../pipes/highlight.pipe';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    NzTableModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzTagModule,
    NzIconModule,
    NzCardModule,
    NzSpinModule,
    NzEmptyModule,
    NzSwitchModule,
    NzInputNumberModule,
    HighlightPipe,
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTableComponent implements OnInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport)
  virtualScrollViewport?: CdkVirtualScrollViewport;

  users: User[] = [];
  loading = false;
  initialLoading = true;
  searchText = '';
  activeFilter = 'all';
  ageFilter = 'all';
  currentSort: SortConfig = { field: 'firstName', direction: 'asc' };
  hasDataLoaded = false;
  isInfiniteScrollMode = false;
  hasMoreData = false;
  pageSize = 50;
  isLoadingMore = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private scrollContainer: HTMLElement | null = null;
  private mutationObserver?: MutationObserver;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.pageSize = this.userService.getPageSize();

    this.userService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
        if (!loading && this.hasDataLoaded) {
          this.initialLoading = false;
          this.isLoadingMore = false;
        }
        this.cdr.markForCheck();
      });

    this.userService.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.users = users;

      if (users.length > 0 || this.hasDataLoaded) {
        this.hasDataLoaded = true;
        this.initialLoading = false;
      }

      this.cdr.markForCheck();

      if (
        this.isInfiniteScrollMode &&
        users.length > 0 &&
        !this.scrollContainer
      ) {
        this.setupScrollListener();
      }
    });

    this.userService.hasMoreData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasMore => {
        this.hasMoreData = hasMore;
        this.cdr.markForCheck();
      });

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(searchText => {
        this.userService.searchUsers(searchText);
        this.scrollToTop();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchText);
  }

  onActiveFilterChange(): void {
    this.userService.filterByActive(
      this.activeFilter as 'all' | 'active' | 'inactive'
    );
    this.scrollToTop();
  }

  onAgeFilterChange(): void {
    this.userService.filterByAge(
      this.ageFilter as 'all' | 'under18' | 'over18'
    );
    this.scrollToTop();
  }

  onSort(field: 'firstName' | 'lastName' | 'dateOfBirth'): void {
    const direction =
      this.currentSort.field === field && this.currentSort.direction === 'asc'
        ? 'desc'
        : 'asc';
    this.currentSort = { field, direction };
    this.userService.sortUsers(field, direction);
    this.scrollToTop();
  }

  private scrollToTop(): void {
    if (this.virtualScrollViewport && !this.isInfiniteScrollMode) {
      this.virtualScrollViewport.scrollToIndex(0, 'smooth');
    }

    if (this.scrollContainer && this.isInfiniteScrollMode) {
      this.scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (this.isInfiniteScrollMode && !this.scrollContainer) {
      requestAnimationFrame(() => {
        const tableBody = document.querySelector(
          '.ant-table-body'
        ) as HTMLElement;
        if (tableBody) {
          tableBody.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  private readonly months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ] as const;

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = this.months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  getActiveStatusColor(active: boolean): string {
    return active ? 'green' : 'red';
  }

  getActiveStatusText(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }

  getSortIcon(field: 'firstName' | 'lastName' | 'dateOfBirth'): string {
    if (this.currentSort.field !== field) return 'menu';
    return this.currentSort.direction === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  trackByUserId(_index: number, user: User): string {
    return user.id;
  }

  getCurrentUserCount(): number {
    return this.users.length;
  }

  toggleScrollMode(value: boolean): void {
    this.isInfiniteScrollMode = value;
    this.userService.setScrollingMode(value);

    if (value) {
      this.setupScrollListener();
    } else {
      this.cleanupScrollListener();
    }

    this.cdr.markForCheck();
  }

  onPageSizeChange(value: number): void {
    if (value && value > 0) {
      this.pageSize = value;
      this.userService.setPageSize(value);
      this.cdr.markForCheck();
    }
  }

  private setupScrollListener(): void {
    if (this.scrollContainer) {
      return;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.mutationObserver = new MutationObserver(() => {
      const tableBody = document.querySelector('.ant-table-body');
      if (tableBody && !this.scrollContainer) {
        this.scrollContainer = tableBody as HTMLElement;

        fromEvent(this.scrollContainer, 'scroll')
          .pipe(takeUntil(this.destroy$), debounceTime(100))
          .subscribe(() => this.onScroll());

        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
          this.mutationObserver = undefined;
        }
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private cleanupScrollListener(): void {
    this.scrollContainer = null;
  }

  private onScroll(): void {
    if (
      !this.scrollContainer ||
      !this.isInfiniteScrollMode ||
      this.isLoadingMore ||
      !this.hasMoreData
    ) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;

    // Load more when scrolled near bottom (50px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      this.isLoadingMore = true;
      this.cdr.markForCheck();
      this.userService.loadMoreUsers();
    }
  }
}
