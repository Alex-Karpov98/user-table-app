export interface User {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  phoneNumber: string;
  active: boolean;
}

export interface UserFilters {
  searchText: string;
  activeFilter: 'all' | 'active' | 'inactive';
  ageFilter: 'all' | 'under18' | 'over18';
}

export interface SortConfig {
  field: 'firstName' | 'lastName' | 'dateOfBirth';
  direction: 'asc' | 'desc';
}

