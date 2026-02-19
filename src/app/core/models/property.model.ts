export type TransactionType = 'SALE' | 'RENT';

export type PropertyType =
  | 'HOUSE'
  | 'APARTMENT'
  | 'STUDIO'
  | 'LOFT'
  | 'OFFICE'
  | 'RETAIL_SPACE'
  | 'WAREHOUSE'
  | 'LAND'
  | 'GARAGE'
  | 'PARKING_SPOT';

export type Province =
  | 'BRUXELLES_CAPITALE'
  | 'BRABANT_WALLON'
  | 'BRABANT_FLAMAND'
  | 'ANVERS'
  | 'LIMBOURG'
  | 'LIEGE'
  | 'NAMUR'
  | 'HAINAUT'
  | 'LUXEMBOURG'
  | 'FLANDRE_OCCIDENTALE'
  | 'FLANDRE_ORIENTALE';

export type EnergyRating = 'A_PLUS_PLUS' | 'A_PLUS' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface EnumValueResponse {
  value: string;
  label: string;
}

export interface PropertySearchParams {
  propertyType?: PropertyType;
  transactionType?: TransactionType;
  province?: Province;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  minBedrooms?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PropertySummaryResponse {
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

export interface PropertyImageResponse {
  id: number;
  fileName: string;
  contentType: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface PropertyDetailResponse {
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

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export interface ContactNoteResponse {
  id: number;
  content: string;
  authorId: number;
  authorName: string;   // "Prénom Nom" de l'admin auteur
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}

export interface GeneralContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
}

export interface VisitRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  propertyReference: string;
}

export interface ContactRequestResponse {
  id: number;
  contactType: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  message: string | null;
  propertyReference: string | null;
  notes: ContactNoteResponse[];
  createdAt: string;
  updatedAt: string;
}
