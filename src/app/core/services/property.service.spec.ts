import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PropertyService } from './property.service';
import { USE_MOCK } from '../mocks/app.mock';
import { environment } from '../../../environments/environment';

/**
 * Tests pour PropertyService.
 *
 * En mode mock (USE_MOCK = true), le service renvoie des données locales sans
 * toucher au réseau. En mode réel, il effectue des appels HTTP.
 * Ces tests couvrent les deux branches via le flag USE_MOCK existant.
 */
describe('PropertyService', () => {
  let service: PropertyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PropertyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifie qu'aucune requête n'est en suspens
  });

  // ─── Instanciation ─────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialise searchParams signal as empty object', () => {
    expect(service.searchParams()).toEqual({});
  });

  it('should initialise isLoading signal to false', () => {
    expect(service.isLoading()).toBeFalse();
  });

  it('should initialise results signal to null', () => {
    expect(service.results()).toBeNull();
  });

  it('totalResults should return 0 when results is null', () => {
    expect(service.totalResults()).toBe(0);
  });

  // ─── getImageUrl ────────────────────────────────────────────────────────────

  describe('getImageUrl()', () => {
    it('should return a non-empty string', () => {
      const url = service.getImageUrl('IMM-001', 101);
      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    });

    if (USE_MOCK) {
      it('(mock) should resolve known imageId from MOCK_IMAGE_URLS', () => {
        const url = service.getImageUrl('IMM-001', 101);
        // L'image 101 est mappée dans MOCK_IMAGE_URLS → URL Unsplash
        expect(url).toContain('unsplash.com');
      });

      it('(mock) should return placehold.co fallback for unknown imageId', () => {
        const url = service.getImageUrl('IMM-999', 9999);
        expect(url).toContain('placehold.co');
        expect(url).toContain('IMM-999');
      });
    } else {
      it('(real) should build the correct API URL', () => {
        const url = service.getImageUrl('IMM-001', 42);
        expect(url).toBe(`${environment.apiBaseUrl}/api/v1/public/properties/IMM-001/images/42`);
      });
    }
  });

  // ─── searchProperties ───────────────────────────────────────────────────────

  describe('searchProperties()', () => {
    if (USE_MOCK) {
      it('(mock) should emit a PageResponse without HTTP call', (done) => {
        service.searchProperties({}).subscribe((page) => {
          expect(page).toBeTruthy();
          expect(Array.isArray(page.content)).toBeTrue();
          expect(typeof page.totalElements).toBe('number');
          done();
        });
        httpMock.expectNone(() => true);
      });

      it('(mock) should filter by transactionType SALE', (done) => {
        service.searchProperties({ transactionType: 'SALE' }).subscribe((page) => {
          const hasRent = page.content.some((p) => p.transactionType === 'RENT');
          expect(hasRent).toBeFalse();
          done();
        });
      });

      it('(mock) should filter by transactionType RENT', (done) => {
        service.searchProperties({ transactionType: 'RENT' }).subscribe((page) => {
          const hasSale = page.content.some((p) => p.transactionType === 'SALE');
          expect(hasSale).toBeFalse();
          done();
        });
      });

      it('(mock) should filter by propertyType HOUSE', (done) => {
        service.searchProperties({ propertyType: 'HOUSE' }).subscribe((page) => {
          const hasOther = page.content.some((p) => p.propertyType !== 'HOUSE');
          expect(hasOther).toBeFalse();
          done();
        });
      });

      it('(mock) should respect page size', (done) => {
        service.searchProperties({ size: 3 }).subscribe((page) => {
          expect(page.content.length).toBeLessThanOrEqual(3);
          done();
        });
      });

      it('(mock) should return page 0 by default', (done) => {
        service.searchProperties({}).subscribe((page) => {
          expect(page.page).toBe(0);
          done();
        });
      });
    } else {
      it('(real) should call the correct endpoint', () => {
        service.searchProperties({ transactionType: 'SALE' }).subscribe();
        const req = httpMock.expectOne((r) =>
          r.url === `${environment.apiBaseUrl}/api/v1/public/properties` &&
          r.params.get('transactionType') === 'SALE'
        );
        expect(req.request.method).toBe('GET');
        req.flush({ content: [], page: 0, size: 12, totalElements: 0, totalPages: 0, last: true });
      });
    }
  });

  // ─── getPropertyTypes ───────────────────────────────────────────────────────

  describe('getPropertyTypes()', () => {
    if (USE_MOCK) {
      it('(mock) should return a non-empty array of EnumValueResponse', (done) => {
        service.getPropertyTypes().subscribe((types) => {
          expect(types.length).toBeGreaterThan(0);
          expect(types[0].value).toBeTruthy();
          expect(types[0].label).toBeTruthy();
          done();
        });
        httpMock.expectNone(() => true);
      });
    } else {
      it('(real) should call /types', () => {
        service.getPropertyTypes().subscribe();
        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/public/properties/types`);
        expect(req.request.method).toBe('GET');
        req.flush([]);
      });
    }
  });

  // ─── getProvinces ───────────────────────────────────────────────────────────

  describe('getProvinces()', () => {
    if (USE_MOCK) {
      it('(mock) should return all 11 Belgian provinces', (done) => {
        service.getProvinces().subscribe((provinces) => {
          expect(provinces.length).toBe(11);
          done();
        });
      });
    } else {
      it('(real) should call /provinces', () => {
        service.getProvinces().subscribe();
        const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/public/properties/provinces`);
        expect(req.request.method).toBe('GET');
        req.flush([]);
      });
    }
  });

  // ─── getPropertyByReference ──────────────────────────────────────────────────

  describe('getPropertyByReference()', () => {
    if (USE_MOCK) {
      it('(mock) should return property detail for known reference', (done) => {
        service.getPropertyByReference('IMM-001').subscribe((detail) => {
          expect(detail.reference).toBe('IMM-001');
          expect(detail.title).toBeTruthy();
          done();
        });
      });

      it('(mock) should error for unknown reference', (done) => {
        service.getPropertyByReference('IMM-999').subscribe({
          next: () => fail('Should have errored'),
          error: (err) => {
            expect(err.status).toBe(404);
            done();
          },
        });
      });

      it('(mock) IMM-001 should have 5 images', (done) => {
        service.getPropertyByReference('IMM-001').subscribe((detail) => {
          expect(detail.images.length).toBe(5);
          done();
        });
      });
    } else {
      it('(real) should call the correct endpoint', () => {
        service.getPropertyByReference('IMM-001').subscribe();
        const req = httpMock.expectOne(
          `${environment.apiBaseUrl}/api/v1/public/properties/IMM-001`
        );
        expect(req.request.method).toBe('GET');
        req.flush({ reference: 'IMM-001', images: [] });
      });
    }
  });
});
