# ImmoFDS Frontend - Angular Application

## Project Overview

ImmoFDS is a Belgian real estate agency web application. This is the **Angular frontend** that consumes the Spring Boot REST API running at `http://localhost:8080`. The application is fully in **French (fr-BE)**.

The app has two sides:
1. **Public website** - Property listings, search with filters, property detail pages, and contact forms
2. **Admin dashboard** - Property management (CRUD + images), contact request management, user management, authentication

---

## Backend API Base URL

```
http://localhost:8080
```

CORS is enabled for all origins on `/api/**`.

---

## Authentication

- JWT-based, stateless
- Login returns an `accessToken` (15 min) and a `refreshToken` (7 days)
- Admin requests must include header: `Authorization: Bearer {accessToken}`
- Refresh via `/api/v1/auth/refresh` with the refresh token
- Token type is always `"Bearer"`

---

## API Endpoints

### Public (no auth)

#### Properties - `/api/v1/public/properties`

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/` | Search properties (paginated, filtered) | `PageResponse<PropertySummaryResponse>` |
| GET | `/{reference}` | Property detail (only PUBLISHED) | `PropertyDetailResponse` |
| GET | `/{reference}/images/{imageId}` | Download image (binary, cached 7 days) | `byte[]` |
| GET | `/types` | Property type enum list | `EnumValueResponse[]` |
| GET | `/provinces` | Province enum list | `EnumValueResponse[]` |

**Search query params:** `propertyType`, `transactionType`, `province`, `city`, `minPrice`, `maxPrice`, `minSurface`, `maxSurface`, `minBedrooms`, `energyRating`, `garden`, `garage`, `terrace`, `basement`, `elevator`, `furnished`, `page` (default 0), `size` (default 12), `sortBy` (default `createdAt`), `sortDir` (default `desc`)

#### Contacts - `/api/v1/public/contacts`

| Method | Path | Request body | Response | Status |
|--------|------|-------------|----------|--------|
| POST | `/general` | `GeneralContactRequest` | `ContactRequestResponse` | 201 |
| POST | `/sell-your-home` | `SellYourHomeRequest` | `ContactRequestResponse` | 201 |
| POST | `/visit-request` | `VisitRequestDto` | `ContactRequestResponse` | 201 |

#### Auth - `/api/v1/auth`

| Method | Path | Request body | Response |
|--------|------|-------------|----------|
| POST | `/login` | `LoginRequest` | `AuthResponse` |
| POST | `/refresh` | `RefreshTokenRequest` | `AuthResponse` |
| POST | `/logout` | `RefreshTokenRequest` | `MessageResponse` |

### Admin (requires JWT - ADMIN or SUPER_ADMIN role)

#### Properties - `/api/v1/admin/properties`

| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------|
| GET | `/` | Query params (same filters minus booleans, `size` default 20) | `PageResponse<PropertySummaryResponse>` | 200 |
| GET | `/{reference}` | - | `PropertyDetailResponse` | 200 |
| POST | `/` | `PropertyCreateRequest` | `PropertyDetailResponse` | 201 |
| PUT | `/{reference}` | `PropertyUpdateRequest` | `PropertyDetailResponse` | 200 |
| PATCH | `/{reference}/status` | `PropertyStatusUpdateRequest` | `PropertyDetailResponse` | 200 |
| DELETE | `/{reference}` | - | `MessageResponse` | 200 |

#### Property Images - `/api/v1/admin/properties/{reference}/images`

| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------|
| GET | `/` | - | `PropertyImageResponse[]` | 200 |
| POST | `/` | Multipart: `file` + `isPrimary` (boolean, default false) | `PropertyImageResponse` | 201 |
| PUT | `/reorder` | `ImageReorderRequest` | `MessageResponse` | 200 |
| PATCH | `/{imageId}/primary` | - | `MessageResponse` | 200 |
| DELETE | `/{imageId}` | - | `MessageResponse` | 200 |

#### Contacts - `/api/v1/admin/contacts`

| Method | Path | Query/Body | Response | Status |
|--------|------|------------|----------|--------|
| GET | `/` | Query: `status`, `type`, `page`, `size`, `sortBy`, `sortDir` | `PageResponse<ContactRequestResponse>` | 200 |
| GET | `/{id}` | - | `ContactRequestResponse` | 200 |
| PATCH | `/{id}/status` | `ContactStatusUpdateRequest` | `ContactRequestResponse` | 200 |
| PATCH | `/{id}/notes` | `ContactNotesUpdateRequest` | `ContactRequestResponse` | 200 |
| DELETE | `/{id}` | - | `MessageResponse` | 200 |

#### Users - `/api/v1/admin/users` (SUPER_ADMIN only)

| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------|
| GET | `/` | Query: `page`, `size`, `sortBy`, `sortDir` | `PageResponse<UserResponse>` | 200 |
| GET | `/{id}` | - | `UserResponse` | 200 |
| POST | `/` | `UserCreateRequest` | `UserResponse` | 201 |
| PUT | `/{id}` | `UserUpdateRequest` | `UserResponse` | 200 |
| DELETE | `/{id}` | - | `MessageResponse` | 200 |

---

## Data Models

### Response types

```typescript
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // always "Bearer"
  expiresIn: number;
  user: UserResponse;
}

interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;       // "ADMIN" | "SUPER_ADMIN"
  active: boolean;
  createdAt: string;  // ISO timestamp
}

interface PropertySummaryResponse {
  reference: string;
  title: string;
  propertyType: string;
  transactionType: string;
  status: string;
  price: number;
  surface: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  province: string;
  energyRating: string | null;
  primaryImageId: number | null;
  createdAt: string;
}

interface PropertyDetailResponse {
  reference: string;
  title: string;
  description: string | null;
  propertyType: string;
  transactionType: string;
  status: string;
  price: number;
  surface: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  floors: number | null;
  constructionYear: number | null;
  energyRating: string | null;
  garden: boolean;
  garage: boolean;
  terrace: boolean;
  basement: boolean;
  elevator: boolean;
  furnished: boolean;
  street: string;
  number: string | null;
  postalCode: string;
  city: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
  images: PropertyImageResponse[];
  createdAt: string;
  updatedAt: string;
}

interface PropertyImageResponse {
  id: number;
  fileName: string;
  contentType: string;
  displayOrder: number;
  isPrimary: boolean;
}

interface ContactRequestResponse {
  id: number;
  contactType: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  message: string | null;
  propertyReference: string | null;
  propertyAddress: string | null;
  propertyType: string | null;
  estimatedPrice: number | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface EnumValueResponse {
  value: string;  // enum name to send in requests
  label: string;  // French display label
}

interface MessageResponse {
  message: string;
}

interface ApiErrorResponse {
  status: number;
  message: string;
  errors: string[] | null;
  timestamp: string;
}
```

### Request types

```typescript
interface LoginRequest {
  email: string;     // required, valid email
  password: string;  // required
}

interface RefreshTokenRequest {
  refreshToken: string; // required
}

interface PropertyCreateRequest {
  title: string;                // required
  description?: string;
  propertyType: PropertyType;   // required
  transactionType: TransactionType; // required
  price: number;                // required, > 0
  surface?: number;             // >= 0
  bedrooms?: number;            // >= 0
  bathrooms?: number;           // >= 0
  rooms?: number;               // >= 0
  floors?: number;              // >= 0
  constructionYear?: number;    // >= 1800
  energyRating?: EnergyRating;
  garden: boolean;
  garage: boolean;
  terrace: boolean;
  basement: boolean;
  elevator: boolean;
  furnished: boolean;
  street: string;               // required
  number?: string;
  postalCode: string;           // required, Belgian postal code (4 digits)
  city: string;                 // required
  province: Province;           // required
  latitude?: number;
  longitude?: number;
}

// PropertyUpdateRequest has the same shape as PropertyCreateRequest

interface PropertyStatusUpdateRequest {
  status: PropertyStatus; // required
}

interface UserCreateRequest {
  email: string;      // required, valid email
  password: string;   // required, min 8 chars
  firstName: string;  // required
  lastName: string;   // required
  role: UserRole;     // required
}

interface UserUpdateRequest {
  email: string;      // required, valid email
  firstName: string;  // required
  lastName: string;   // required
  role: UserRole;     // required
  active: boolean;
}

interface GeneralContactRequest {
  firstName: string;  // required
  lastName: string;   // required
  email: string;      // required, valid email
  phone?: string;
  message: string;    // required
}

interface SellYourHomeRequest {
  firstName: string;         // required
  lastName: string;          // required
  email: string;             // required, valid email
  phone?: string;
  message?: string;
  propertyAddress: string;   // required
  propertyType: PropertyType; // required
  estimatedPrice?: number;   // > 0 if provided
}

interface VisitRequestDto {
  firstName: string;          // required
  lastName: string;           // required
  email: string;              // required, valid email
  phone?: string;
  message?: string;
  propertyReference: string;  // required
}

interface ContactStatusUpdateRequest {
  status: ContactStatus; // required
}

interface ContactNotesUpdateRequest {
  adminNotes?: string;
}

interface ImageReorderRequest {
  imageIds: number[]; // required, non-empty
}
```

---

## Enums (value -> French label)

### PropertyType
| Value | Label |
|-------|-------|
| `HOUSE` | Maison |
| `APARTMENT` | Appartement |
| `STUDIO` | Studio |
| `LOFT` | Loft |
| `OFFICE` | Bureau |
| `RETAIL_SPACE` | Commerce |
| `WAREHOUSE` | Entrepôt |
| `LAND` | Terrain |
| `GARAGE` | Garage |
| `PARKING_SPOT` | Emplacement de parking |

### TransactionType
| Value | Label |
|-------|-------|
| `SALE` | Vente |
| `RENT` | Location |

### PropertyStatus
| Value | Label |
|-------|-------|
| `DRAFT` | Brouillon |
| `PUBLISHED` | Publié |
| `SOLD` | Vendu |
| `RENTED` | Loué |
| `ARCHIVED` | Archivé |

**Valid status transitions:**
- DRAFT -> PUBLISHED, ARCHIVED
- PUBLISHED -> SOLD, RENTED, ARCHIVED
- SOLD -> ARCHIVED
- RENTED -> ARCHIVED
- ARCHIVED -> DRAFT

### ContactStatus
| Value | Label |
|-------|-------|
| `NEW` | Nouveau |
| `IN_PROGRESS` | En cours |
| `CLOSED` | Clôturé |

### ContactType
| Value | Label |
|-------|-------|
| `SELL_YOUR_HOME` | Vendre votre bien |
| `GENERAL_CONTACT` | Contact général |
| `VISIT_REQUEST` | Demande de visite |

### EnergyRating
| Value | Label |
|-------|-------|
| `A_PLUS_PLUS` | A++ |
| `A_PLUS` | A+ |
| `A` | A |
| `B` | B |
| `C` | C |
| `D` | D |
| `E` | E |
| `F` | F |
| `G` | G |

### Province (Belgian)
| Value | Label |
|-------|-------|
| `BRUXELLES_CAPITALE` | Bruxelles-Capitale |
| `BRABANT_WALLON` | Brabant wallon |
| `BRABANT_FLAMAND` | Brabant flamand |
| `ANVERS` | Anvers |
| `LIMBOURG` | Limbourg |
| `LIEGE` | Liège |
| `NAMUR` | Namur |
| `HAINAUT` | Hainaut |
| `LUXEMBOURG` | Luxembourg |
| `FLANDRE_OCCIDENTALE` | Flandre occidentale |
| `FLANDRE_ORIENTALE` | Flandre orientale |

### UserRole
| Value | Label |
|-------|-------|
| `ADMIN` | Administrateur |
| `SUPER_ADMIN` | Super administrateur |

---

## Image handling

- Image URL pattern: `/api/v1/public/properties/{reference}/images/{imageId}`
- Upload: `POST /api/v1/admin/properties/{reference}/images` as `multipart/form-data` with field `file` and optional `isPrimary` boolean
- Accepted formats: JPEG, PNG, WebP
- Max file size: 10 MB, max request size: 50 MB
- Each property image has a `displayOrder` (int) and `isPrimary` (boolean)
- The `primaryImageId` field on `PropertySummaryResponse` gives the main image for thumbnails
- Images are served with 7-day cache headers

---

## Business rules

1. **Public search only shows PUBLISHED properties.** Admin search shows all statuses.
2. **New properties always start as DRAFT.** The reference is auto-generated by the backend.
3. **Delete = Archive.** Deleting a property sets its status to ARCHIVED, it is not physically removed.
4. **Contact types map to 3 distinct forms** with different required fields (see request DTOs above).
5. **User management is SUPER_ADMIN only.** Regular ADMINs can manage properties and contacts but not users.
6. **Belgian postal codes** are 4-digit numbers validated server-side per province.
7. **Null fields are omitted** from JSON responses (`spring.jackson.default-property-inclusion: non_null`).
8. **Default admin account:** `admin@immofds.be` / `Admin@2026!` (SUPER_ADMIN role, seeded by Liquibase migration).

---

## Swagger / OpenAPI

The backend exposes Swagger UI at `http://localhost:8080/swagger-ui.html` and the OpenAPI spec at `http://localhost:8080/api-docs` for interactive API exploration.
