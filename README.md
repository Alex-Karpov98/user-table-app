# User Table Application

A comprehensive Angular 17+ application featuring a user management table with advanced filtering, sorting, and search capabilities.

## Features

### ✅ Core Functionality
- **User Table**: Displays users with First Name, Last Name, Date of Birth, Phone Number, and Active status
- **Mock Data**: 1000+ generated users with realistic data
- **Responsive Design**: Works on desktop and mobile devices

### ✅ Search & Filtering
- **Text Search**: Real-time search across name and phone fields with highlighting
- **Active Status Filter**: Filter by Active/Inactive users
- **Age Filter**: Filter by age groups (< 18 years, > 18 years)
- **Debounced Search**: Optimized search performance with 300ms debounce

### ✅ Sorting
- **Multi-column Sorting**: Sort by First Name, Last Name, and Date of Birth
- **Ascending/Descending**: Toggle sort direction with visual indicators
- **Persistent Sorting**: Maintains sort state during filtering

### ✅ Performance Optimizations
- **Infinite Scroll**: Loads 50 users at a time for optimal performance
- **TrackBy Function**: Efficient DOM updates using user ID tracking
- **Debounced Search**: Prevents excessive API calls during typing
- **Lazy Loading**: Only renders visible users

### ✅ UI/UX Features
- **Ant Design Components**: Professional UI using ng-zorro-antd
- **Search Highlighting**: Visual highlighting of search terms
- **Loading States**: Smooth loading indicators
- **Empty States**: User-friendly empty state messages
- **Responsive Layout**: Mobile-friendly design

## Technical Stack

- **Angular 17+**: Latest Angular framework
- **ng-zorro-antd**: Ant Design components for Angular
- **TypeScript**: Type-safe development
- **SCSS**: Enhanced styling capabilities
- **RxJS**: Reactive programming for data management

## Project Structure

```
src/app/
├── models/
│   └── user.model.ts          # User interface and type definitions
├── services/
│   └── user.service.ts        # Data management and business logic
├── user-table/
│   ├── user-table.component.ts    # Main table component
│   ├── user-table.component.html  # Template with Ant Design
│   └── user-table.component.scss  # Component styles
└── app.component.*            # Root component
```

## Key Components

### UserService
- Generates 1000+ mock users with realistic data
- Implements filtering, sorting, and pagination logic
- Manages infinite scroll state
- Optimized search with debouncing

### UserTableComponent
- Main table component with all UI interactions
- Handles search, filtering, and sorting
- Implements infinite scroll functionality
- Manages loading states and user feedback

## Performance Features

1. **Infinite Scroll**: Loads data in chunks of 50 users
2. **Search Debouncing**: 300ms delay to prevent excessive filtering
3. **TrackBy Function**: Efficient Angular change detection
4. **Lazy Loading**: Only renders visible table rows
5. **Optimized Filtering**: Client-side filtering for fast response

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   ng serve
   ```

3. **Open Browser**: Navigate to `http://localhost:4200`

## Usage

### Search
- Type in the search box to find users by name or phone number
- Search terms are highlighted in the results
- Search is debounced for optimal performance

### Filtering
- **Status Filter**: Choose All, Active Only, or Inactive Only
- **Age Filter**: Filter by age groups (Under 18, 18 and Over)

### Sorting
- Click column headers to sort by First Name, Last Name, or Date of Birth
- Click again to reverse sort direction
- Visual indicators show current sort state

### Infinite Scroll
- Scroll down to automatically load more users
- Loading indicator appears when fetching more data
- Smooth scrolling experience with no pagination needed

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development Notes

- Uses Angular 17+ standalone components
- Implements modern Angular patterns
- Follows TypeScript best practices
- Responsive design with mobile support
- Accessible UI components from Ant Design

## Future Enhancements

- Export functionality (CSV/Excel)
- Advanced filtering options
- User profile modals
- Bulk operations
- Real-time data updates