import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User, UserFilters, SortConfig } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [];
  private filteredUsers: User[] = [];
  private currentFilters: UserFilters = {
    searchText: '',
    activeFilter: 'all',
    ageFilter: 'all'
  };
  private currentSort: SortConfig = { field: 'firstName', direction: 'asc' };
  private currentPage = 0;
  private pageSize = 50;
  private hasMoreData = true;

  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public users$ = this.usersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMockData();
  }

  private loadMockData(): void {
    this.loadingSubject.next(true);
    
    setTimeout(() => {
      this.http.get<User[]>('/mock-users.json').subscribe({
        next: (users) => {
          this.users = users;
          this.loadingSubject.next(false);
          this.applyFiltersAndSort();
        },
        error: (error) => {
          this.users = [];
          this.loadingSubject.next(false);
          this.applyFiltersAndSort();
        }
      });
    }, 1500);
  }

  private applyFiltersAndSort(): void {
    let filtered = [...this.users];

    // Apply search filter
    if (this.currentFilters.searchText) {
      const searchLower = this.currentFilters.searchText.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.phoneNumber.includes(searchLower)
      );
    }

    // Apply active filter
    if (this.currentFilters.activeFilter !== 'all') {
      const isActive = this.currentFilters.activeFilter === 'active';
      filtered = filtered.filter(user => user.active === isActive);
    }

    // Apply age filter
    if (this.currentFilters.ageFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(user => {
        const birthDate = new Date(user.dateOfBirth);
        const age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()) 
          ? age - 1 : age;
        
        if (this.currentFilters.ageFilter === 'under18') {
          return actualAge < 18;
        } else if (this.currentFilters.ageFilter === 'over18') {
          return actualAge >= 18;
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.currentSort.field) {
        case 'firstName':
          aValue = a.firstName;
          bValue = b.firstName;
          break;
        case 'lastName':
          aValue = a.lastName;
          bValue = b.lastName;
          break;
        case 'dateOfBirth':
          aValue = new Date(a.dateOfBirth);
          bValue = new Date(b.dateOfBirth);
          break;
      }

      if (aValue < bValue) return this.currentSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.currentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredUsers = filtered;
    this.currentPage = 0;
    this.hasMoreData = filtered.length > 0;
    
    // Clear existing users and load new ones
    this.usersSubject.next([]);
    
    if (filtered.length > 0) {
      this.loadMoreUsers();
    } else {
      // No results found, stop loading
      this.loadingSubject.next(false);
    }
  }

  public loadMoreUsers(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newUsers = this.filteredUsers.slice(startIndex, endIndex);
    
    if (newUsers.length > 0) {
      setTimeout(() => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, ...newUsers]);
        this.currentPage++;
        this.hasMoreData = endIndex < this.filteredUsers.length;
        this.loadingSubject.next(false);
      }, 800);
    } else {
      // No more users to load, stop loading
      this.loadingSubject.next(false);
    }
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

  public sortUsers(field: 'firstName' | 'lastName' | 'dateOfBirth', direction: 'asc' | 'desc'): void {
    this.currentSort = { field, direction };
    this.applyFiltersAndSort();
  }

  public hasMoreDataAvailable(): boolean {
    return this.hasMoreData;
  }

  public resetTable(): void {
    this.usersSubject.next([]);
    this.currentPage = 0;
    this.hasMoreData = true;
    this.loadMoreUsers();
  }
}
