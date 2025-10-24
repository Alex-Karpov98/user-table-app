import { Injectable } from '@angular/core';
import { BehaviorSubject, tap, delay, timer, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User, UserFilters, SortConfig } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private allUsers: User[] = [];
  private filteredUsers: User[] = [];
  private currentFilters: UserFilters = {
    searchText: '',
    activeFilter: 'all',
    ageFilter: 'all',
  };
  private currentSort: SortConfig = { field: 'firstName', direction: 'asc' };
  private currentPage = 0;
  private pageSize = 50;
  private isInfiniteScrollMode = false;

  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private hasMoreDataSubject = new BehaviorSubject<boolean>(true);

  public users$ = this.usersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public hasMoreData$ = this.hasMoreDataSubject.asObservable();

  private filterSubscription?: Subscription;
  private loadMoreSubscription?: Subscription;
  private initialLoadSubscription?: Subscription;

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loadingSubject.next(true);

    this.initialLoadSubscription = this.http
      .get<User[]>('/mock-users.json')
      .pipe(
        delay(800),
        tap({
          next: users => {
            this.allUsers = users;
            this.loadingSubject.next(false);
          },
          error: () => {
            this.allUsers = [];
            this.loadingSubject.next(false);
          },
        })
      )
      .subscribe(() => {
        this.applyFiltersAndSort();
      });
  }

  private applyFiltersAndSort(): void {
    const filtered = this.allUsers.filter((user: User) => {
      if (this.currentFilters.searchText) {
        const searchLower = this.currentFilters.searchText.toLowerCase();
        const matchesSearch =
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.phoneNumber.includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (this.currentFilters.activeFilter !== 'all') {
        const isActive = this.currentFilters.activeFilter === 'active';
        if (user.active !== isActive) return false;
      }

      if (this.currentFilters.ageFilter !== 'all') {
        const age = this.calculateAge(user.dateOfBirth);
        if (this.currentFilters.ageFilter === 'under18' && age >= 18) {
          return false;
        }
        if (this.currentFilters.ageFilter === 'over18' && age < 18) {
          return false;
        }
      }

      return true;
    });

    filtered.sort(this.getSortComparator());

    this.filteredUsers = filtered;
    this.currentPage = 0;

    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }

    this.filterSubscription = timer(400).subscribe(() => {
      if (this.isInfiniteScrollMode) {
        const firstPage = filtered.slice(0, this.pageSize);
        this.usersSubject.next(firstPage);
        this.hasMoreDataSubject.next(filtered.length > this.pageSize);
        this.currentPage = 1;
      } else {
        this.usersSubject.next(filtered);
        this.hasMoreDataSubject.next(false);
      }
      this.loadingSubject.next(false);
    });
  }

  private calculateAge(dateOfBirth: string): number {
    const now = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private getSortComparator(): (a: User, b: User) => number {
    const { field, direction } = this.currentSort;
    const multiplier = direction === 'asc' ? 1 : -1;

    return (a: User, b: User) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (field === 'dateOfBirth') {
        aValue = new Date(a[field]);
        bValue = new Date(b[field]);
      } else {
        aValue = a[field];
        bValue = b[field];
      }

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    };
  }

  public searchUsers(searchText: string): void {
    this.loadingSubject.next(true);
    this.currentFilters.searchText = searchText;
    this.applyFiltersAndSort();
  }

  public filterByActive(activeFilter: 'all' | 'active' | 'inactive'): void {
    this.loadingSubject.next(true);
    this.currentFilters.activeFilter = activeFilter;
    this.applyFiltersAndSort();
  }

  public filterByAge(ageFilter: 'all' | 'under18' | 'over18'): void {
    this.loadingSubject.next(true);
    this.currentFilters.ageFilter = ageFilter;
    this.applyFiltersAndSort();
  }

  public sortUsers(
    field: 'firstName' | 'lastName' | 'dateOfBirth',
    direction: 'asc' | 'desc'
  ): void {
    this.loadingSubject.next(true);
    this.currentSort = { field, direction };
    this.applyFiltersAndSort();
  }

  public loadMoreUsers(): void {
    if (!this.isInfiniteScrollMode || this.loadingSubject.value) {
      return;
    }

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const nextBatch = this.filteredUsers.slice(startIndex, endIndex);

    if (nextBatch.length > 0) {
      this.loadingSubject.next(true);

      if (this.loadMoreSubscription) {
        this.loadMoreSubscription.unsubscribe();
      }

      this.loadMoreSubscription = timer(600).subscribe(() => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, ...nextBatch]);
        this.currentPage++;
        this.hasMoreDataSubject.next(endIndex < this.filteredUsers.length);
        this.loadingSubject.next(false);
      });
    } else {
      this.hasMoreDataSubject.next(false);
    }
  }

  public setScrollingMode(isInfinite: boolean): void {
    this.isInfiniteScrollMode = isInfinite;
    this.applyFiltersAndSort();
  }

  public setPageSize(size: number): void {
    this.pageSize = Math.max(10, Math.min(500, size));
    if (this.isInfiniteScrollMode) {
      this.applyFiltersAndSort();
    }
  }

  public getPageSize(): number {
    return this.pageSize;
  }

  public isInfiniteMode(): boolean {
    return this.isInfiniteScrollMode;
  }

  public ngOnDestroy(): void {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
    if (this.loadMoreSubscription) {
      this.loadMoreSubscription.unsubscribe();
    }
    if (this.initialLoadSubscription) {
      this.initialLoadSubscription.unsubscribe();
    }
  }
}
