import { EnumValueResponse, PageResponse, PropertySummaryResponse } from '../models/property.model';

export const MOCK_PROPERTY_TYPES: EnumValueResponse[] = [
  { value: 'HOUSE', label: 'Maison' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'LOFT', label: 'Loft' },
  { value: 'OFFICE', label: 'Bureau' },
  { value: 'RETAIL_SPACE', label: 'Commerce' },
  { value: 'WAREHOUSE', label: 'Entrepôt' },
  { value: 'LAND', label: 'Terrain' },
  { value: 'GARAGE', label: 'Garage' },
  { value: 'PARKING_SPOT', label: 'Emplacement de parking' },
];

export const MOCK_PROVINCES: EnumValueResponse[] = [
  { value: 'BRUXELLES_CAPITALE', label: 'Bruxelles-Capitale' },
  { value: 'BRABANT_WALLON', label: 'Brabant wallon' },
  { value: 'BRABANT_FLAMAND', label: 'Brabant flamand' },
  { value: 'ANVERS', label: 'Anvers' },
  { value: 'LIMBOURG', label: 'Limbourg' },
  { value: 'LIEGE', label: 'Liège' },
  { value: 'NAMUR', label: 'Namur' },
  { value: 'HAINAUT', label: 'Hainaut' },
  { value: 'LUXEMBOURG', label: 'Luxembourg' },
  { value: 'FLANDRE_OCCIDENTALE', label: 'Flandre occidentale' },
  { value: 'FLANDRE_ORIENTALE', label: 'Flandre orientale' },
];

export const MOCK_PROPERTIES: PropertySummaryResponse[] = [
  {
    reference: 'IMM-001',
    title: 'Belle maison avec jardin à Uccle',
    propertyType: 'HOUSE',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 485000,
    surface: 185,
    bedrooms: 4,
    bathrooms: 2,
    city: 'Uccle',
    province: 'BRUXELLES_CAPITALE',
    energyRating: 'B',
    primaryImageId: null,
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    reference: 'IMM-002',
    title: 'Appartement lumineux au cœur de Liège',
    propertyType: 'APARTMENT',
    transactionType: 'RENT',
    status: 'PUBLISHED',
    price: 950,
    surface: 78,
    bedrooms: 2,
    bathrooms: 1,
    city: 'Liège',
    province: 'LIEGE',
    energyRating: 'C',
    primaryImageId: null,
    createdAt: '2025-01-12T09:30:00Z',
  },
  {
    reference: 'IMM-003',
    title: 'Studio moderne proche des transports',
    propertyType: 'STUDIO',
    transactionType: 'RENT',
    status: 'PUBLISHED',
    price: 680,
    surface: 32,
    bedrooms: null,
    bathrooms: 1,
    city: 'Bruxelles',
    province: 'BRUXELLES_CAPITALE',
    energyRating: 'A',
    primaryImageId: null,
    createdAt: '2025-01-14T14:00:00Z',
  },
  {
    reference: 'IMM-004',
    title: 'Loft industriel rénové — Gand',
    propertyType: 'LOFT',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 320000,
    surface: 120,
    bedrooms: 1,
    bathrooms: 1,
    city: 'Gand',
    province: 'FLANDRE_ORIENTALE',
    energyRating: 'B',
    primaryImageId: null,
    createdAt: '2025-01-15T11:00:00Z',
  },
  {
    reference: 'IMM-005',
    title: 'Villa avec piscine — Waterloo',
    propertyType: 'HOUSE',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 1250000,
    surface: 420,
    bedrooms: 6,
    bathrooms: 4,
    city: 'Waterloo',
    province: 'BRABANT_WALLON',
    energyRating: 'A',
    primaryImageId: null,
    createdAt: '2025-01-16T08:00:00Z',
  },
  {
    reference: 'IMM-006',
    title: 'Bureau en open space — centre d\'Anvers',
    propertyType: 'OFFICE',
    transactionType: 'RENT',
    status: 'PUBLISHED',
    price: 2400,
    surface: 95,
    bedrooms: null,
    bathrooms: 1,
    city: 'Anvers',
    province: 'ANVERS',
    energyRating: 'C',
    primaryImageId: null,
    createdAt: '2025-01-17T10:00:00Z',
  },
  {
    reference: 'IMM-007',
    title: 'Terrain à bâtir — Namur',
    propertyType: 'LAND',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 95000,
    surface: 650,
    bedrooms: null,
    bathrooms: null,
    city: 'Namur',
    province: 'NAMUR',
    energyRating: null,
    primaryImageId: null,
    createdAt: '2025-01-18T09:00:00Z',
  },
  {
    reference: 'IMM-008',
    title: 'Appartement 3 chambres — Louvain',
    propertyType: 'APARTMENT',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 275000,
    surface: 105,
    bedrooms: 3,
    bathrooms: 2,
    city: 'Louvain',
    province: 'BRABANT_FLAMAND',
    energyRating: 'B',
    primaryImageId: null,
    createdAt: '2025-01-19T10:00:00Z',
  },
  {
    reference: 'IMM-009',
    title: 'Commerce rez-de-chaussée — Bruges',
    propertyType: 'RETAIL_SPACE',
    transactionType: 'RENT',
    status: 'PUBLISHED',
    price: 1800,
    surface: 60,
    bedrooms: null,
    bathrooms: null,
    city: 'Bruges',
    province: 'FLANDRE_OCCIDENTALE',
    energyRating: 'D',
    primaryImageId: null,
    createdAt: '2025-01-20T11:00:00Z',
  },
  {
    reference: 'IMM-010',
    title: 'Maison de caractère — Arlon',
    propertyType: 'HOUSE',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 310000,
    surface: 145,
    bedrooms: 3,
    bathrooms: 1,
    city: 'Arlon',
    province: 'LUXEMBOURG',
    energyRating: 'E',
    primaryImageId: null,
    createdAt: '2025-01-21T09:00:00Z',
  },
  {
    reference: 'IMM-011',
    title: 'Studio cosy — Schaerbeek',
    propertyType: 'STUDIO',
    transactionType: 'RENT',
    status: 'PUBLISHED',
    price: 720,
    surface: 28,
    bedrooms: null,
    bathrooms: 1,
    city: 'Schaerbeek',
    province: 'BRUXELLES_CAPITALE',
    energyRating: 'C',
    primaryImageId: null,
    createdAt: '2025-01-22T10:00:00Z',
  },
  {
    reference: 'IMM-012',
    title: 'Appartement avec terrasse — Mons',
    propertyType: 'APARTMENT',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 199000,
    surface: 88,
    bedrooms: 2,
    bathrooms: 1,
    city: 'Mons',
    province: 'HAINAUT',
    energyRating: 'C',
    primaryImageId: null,
    createdAt: '2025-01-23T08:30:00Z',
  },
];

export function getMockPage(
  params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    transactionType?: string;
    propertyType?: string;
    province?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
  } = {}
): PageResponse<PropertySummaryResponse> {
  const page = params.page ?? 0;
  const size = params.size ?? 12;
  const sortBy = params.sortBy ?? 'createdAt';
  const sortDir = params.sortDir ?? 'desc';

  const filtered = MOCK_PROPERTIES.filter((p) => {
    if (params.transactionType && p.transactionType !== params.transactionType) return false;
    if (params.propertyType && p.propertyType !== params.propertyType) return false;
    if (params.province && p.province !== params.province) return false;
    if (params.city && !p.city.toLowerCase().includes(params.city.toLowerCase())) return false;
    if (params.minPrice != null && p.price < params.minPrice) return false;
    if (params.maxPrice != null && p.price > params.maxPrice) return false;
    if (params.minBedrooms != null && (p.bedrooms == null || p.bedrooms < params.minBedrooms)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA: number | string;
    let valB: number | string;

    switch (sortBy) {
      case 'price':
        valA = a.price;
        valB = b.price;
        break;
      case 'surface':
        valA = a.surface ?? 0;
        valB = b.surface ?? 0;
        break;
      case 'createdAt':
      default:
        valA = a.createdAt;
        valB = b.createdAt;
        break;
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const total = sorted.length;
  const content = sorted.slice(page * size, page * size + size);

  return {
    content,
    page,
    size,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    last: (page + 1) * size >= total,
  };
}
