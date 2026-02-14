import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

// ─── Nominatim response shape (partial) ───────────────────────────────────
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
  };
}

// ─── Province mapping ──────────────────────────────────────────────────────
// Nominatim retourne le champ 'state' en fr/nl/de selon la langue de l'adresse.
// On fait un matching par sous-chaîne (lowercase) pour couvrir les variantes.
const STATE_TO_PROVINCE: Array<{ keywords: string[]; province: string }> = [
  { keywords: ['bruxelles', 'brussel', 'brussels'],                          province: 'BRUXELLES_CAPITALE' },
  { keywords: ['brabant wallon', 'waals-brabant', 'waals brabant'],          province: 'BRABANT_WALLON' },
  { keywords: ['brabant flamand', 'vlaams-brabant', 'vlaams brabant'],       province: 'BRABANT_FLAMAND' },
  { keywords: ['anvers', 'antwerpen', 'antwerp'],                            province: 'ANVERS' },
  { keywords: ['limbourg', 'limburg'],                                       province: 'LIMBOURG' },
  { keywords: ['liège', 'liege', 'lüttich'],                                 province: 'LIEGE' },
  { keywords: ['namur', 'namen'],                                            province: 'NAMUR' },
  { keywords: ['hainaut', 'henegouwen'],                                     province: 'HAINAUT' },
  { keywords: ['luxembourg'],                                                province: 'LUXEMBOURG' },
  { keywords: ['flandre occidentale', 'west-vlaanderen', 'west vlaanderen'], province: 'FLANDRE_OCCIDENTALE' },
  { keywords: ['flandre orientale', 'oost-vlaanderen', 'oost vlaanderen'],   province: 'FLANDRE_ORIENTALE' },
];

function mapStateToProvince(state: string | undefined): string | null {
  if (!state) return null;
  const lower = state.toLowerCase();
  for (const entry of STATE_TO_PROVINCE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.province;
    }
  }
  return null;
}

// ─── Interface publique ────────────────────────────────────────────────────
export interface AddressSuggestion {
  displayName: string;
  road: string;
  houseNumber: string;
  postcode: string;
  city: string;
  province: string | null;
  lat: number;
  lon: number;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

@Injectable({ providedIn: 'root' })
export class AddressAutocompleteService {
  private readonly http = inject(HttpClient);

  /**
   * Recherche des adresses belges via Nominatim.
   * Le debounce est géré par le composant appelant.
   * Ne propage jamais d'erreur (retourne [] en cas d'échec).
   */
  search(query: string): Observable<AddressSuggestion[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('countrycodes', 'be')
      .set('limit', '5');

    // Accept-Language: fr pousse Nominatim à retourner les noms en français
    // ce qui améliore le taux de succès du mapping province.
    const headers = new HttpHeaders({ 'Accept-Language': 'fr' });

    return this.http
      .get<NominatimResult[]>(NOMINATIM_URL, { params, headers })
      .pipe(
        map((results) => results.map((r) => this.mapResult(r))),
        catchError(() => of([]))
      );
  }

  private mapResult(r: NominatimResult): AddressSuggestion {
    const addr = r.address;
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
    return {
      displayName: r.display_name,
      road:        addr.road ?? '',
      houseNumber: addr.house_number ?? '',
      postcode:    addr.postcode ?? '',
      city,
      province:    mapStateToProvince(addr.state),
      lat:         parseFloat(r.lat),
      lon:         parseFloat(r.lon),
    };
  }
}
