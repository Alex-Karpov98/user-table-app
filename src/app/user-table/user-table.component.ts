import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService } from '../services/user.service';
import { User, SortConfig } from '../models/user.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzTagModule,
    NzIconModule,
    NzCardModule,
    NzSpinModule,
    NzEmptyModule,
  ],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss'],
})
export class UserTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('tableContainer', { static: false }) tableContainer!: ElementRef;

  users: User[] = [];
  loading = false;
  initialLoading = false;
  searchText = '';
  activeFilter = 'all';
  ageFilter = 'all';
  currentSort: SortConfig = { field: 'firstName', direction: 'asc' };

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Subscribe to loading state
    this.userService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.initialLoading = loading;
        this.loading = loading;
      });

    // Subscribe to users data
    this.userService.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.users = users;
      this.loading = false;

      // Setup scroll listener after data loads
      if (users.length > 0) {
        setTimeout(() => {
          this.setupScrollListener();
        }, 100);
      }
    });

    // Debounce search input
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(searchText => {
        this.userService.searchUsers(searchText);
      });
  }

  ngAfterViewInit(): void {
    // Wait for table to be rendered, then setup scroll listener
    setTimeout(() => {
      this.setupScrollListener();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollListener(): void {
    // Find the table body element
    const tableBody = document.querySelector('.ant-table-body');
    if (tableBody) {
      tableBody.addEventListener('scroll', this.onTableScroll.bind(this));
    }
  }

  private onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Load more when scrolled to bottom
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (this.userService.hasMoreDataAvailable() && !this.loading) {
        this.loading = true;
        this.userService.loadMoreUsers();
      }
    }
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchText);
  }

  onActiveFilterChange(): void {
    this.userService.filterByActive(
      this.activeFilter as 'all' | 'active' | 'inactive'
    );
  }

  onAgeFilterChange(): void {
    this.userService.filterByAge(
      this.ageFilter as 'all' | 'under18' | 'over18'
    );
  }

  onSort(field: 'firstName' | 'lastName' | 'dateOfBirth'): void {
    const direction =
      this.currentSort.field === field && this.currentSort.direction === 'asc'
        ? 'desc'
        : 'asc';
    this.currentSort = { field, direction };
    this.userService.sortUsers(field, direction);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
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
    ];

    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  highlightText(text: string, searchText: string): string {
    if (!searchText || !text) return text;

    const regex = new RegExp(`(${searchText})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
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

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  getCurrentUserCount(): number {
    return this.users.length;
  }
}
