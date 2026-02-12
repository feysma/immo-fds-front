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

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
