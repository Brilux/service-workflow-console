# Service Workflow Console

[![CI](https://github.com/Brilux/service-workflow-console/actions/workflows/ci.yml/badge.svg)](https://github.com/Brilux/service-workflow-console/actions/workflows/ci.yml)

A modern web console for managing connected devices and service workflows (maintenance/RMA). Built with Angular 18, Angular Material, and NgRx Signal Store.

## Features

- **Device Management**: View, search, filter, and edit connected devices
- **Service Tickets**: Create and manage maintenance/RMA workflows with status transitions
- **Role-Based Access Control**: Admin, Technician, and Viewer roles with different permissions
- **Audit Logging**: Track all changes to devices and tickets
- **Responsive UI**: Material Design with mobile-friendly layout

## Tech Stack

- **Frontend**: Angular 18 with standalone components
- **UI Framework**: Angular Material
- **State Management**: NgRx Signal Store
- **Backend (Mock)**: json-server
- **Testing**: Jasmine/Karma (unit), Playwright (e2e)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker with nginx

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Local Development

```bash
# Install dependencies
npm install

# Start development server (frontend + API)
npm run dev

# Or run separately:
npm run start      # Frontend on http://localhost:4200
npm run api        # API on http://localhost:3001
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend and API concurrently |
| `npm run start` | Start Angular development server |
| `npm run api` | Start json-server mock API |
| `npm run build` | Build for development |
| `npm run build:prod` | Build for production |
| `npm run test` | Run unit tests |
| `npm run test:ci` | Run unit tests in CI mode |
| `npm run lint` | Run ESLint |
| `npm run e2e` | Run Playwright e2e tests |
| `npm run e2e:ui` | Run Playwright with UI |

## Docker

### Production Build

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application at http://localhost
```

### Development with Docker

```bash
# Run just the API in Docker
docker-compose -f docker-compose.dev.yml up
```

## Project Structure

```
src/app/
├── core/                   # App shell, layout, guards, interceptors
│   ├── guards/            # Route guards (auth, role)
│   ├── interceptors/      # HTTP interceptors (api, error, retry)
│   ├── layout/            # Main layout component
│   └── services/          # Core services (notifications)
├── shared/                 # Shared UI components, pipes, directives
│   └── components/        # Reusable UI components
├── features/              # Feature modules
│   ├── auth/              # Authentication feature
│   │   ├── pages/        # Login page
│   │   └── services/     # Auth service
│   ├── devices/           # Devices feature
│   │   ├── pages/        # List and detail pages
│   │   ├── components/   # Device-specific components
│   │   ├── store/        # NgRx Signal Store
│   │   └── data-access/  # API service
│   └── tickets/           # Service tickets feature
│       ├── pages/        # List and detail pages
│       ├── components/   # Ticket-specific components
│       ├── store/        # NgRx Signal Store
│       └── data-access/  # API service
├── data-access/           # API client utilities
└── models/                # Domain models and DTOs
```

## Role-Based Access

| Feature | Admin | Technician | Viewer |
|---------|-------|------------|--------|
| View devices | ✓ | ✓ | ✓ |
| Edit devices | ✓ | ✓ | ✗ |
| View tickets | ✓ | ✓ | ✓ |
| Create tickets | ✓ | ✓ | ✗ |
| Update tickets | ✓ | ✓ | ✗ |
| Assign tickets | ✓ | ✗ | ✗ |

## API Endpoints

The mock API (json-server) provides:

| Endpoint | Description |
|----------|-------------|
| `GET /devices` | List devices with pagination |
| `GET /devices/:id` | Get device details |
| `PATCH /devices/:id` | Update device |
| `GET /tickets` | List tickets with pagination |
| `GET /tickets/:id` | Get ticket details |
| `POST /tickets` | Create ticket |
| `PATCH /tickets/:id` | Update ticket |
| `GET /auditLogs` | Get audit logs |

### Query Parameters

- `_page`, `_limit` - Pagination
- `_sort`, `_order` - Sorting
- `q` - Full-text search
- `status`, `priority` - Filters

## Testing

### Unit Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once with coverage
npm run test:ci
```

### E2E Tests

```bash
# Run e2e tests headless
npm run e2e

# Run e2e tests with UI
npm run e2e:ui

# Run e2e tests headed (see browser)
npm run e2e:headed
```

## Architecture Notes

### State Management

Each feature uses NgRx Signal Store with:
- Entities list and selected entity
- Pagination metadata
- Loading/error flags
- Computed selectors for filtered views
- Methods for CRUD operations

### HTTP Handling

- Central API client with base URL configuration
- Request retry with exponential backoff for GET requests
- Global error handling with snackbar notifications
- Proper loading states (spinner/skeleton) and error states

### Routing

- Route guards for authentication and authorization
- Lazy-loaded feature modules
- URL-based navigation with detail pages

## Screenshots

*Screenshots coming soon*

## License

MIT
