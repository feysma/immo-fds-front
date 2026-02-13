import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LOCALE_ID, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFrBe from '@angular/common/locales/fr-BE';
import { of, throwError } from 'rxjs';
import { PropertyDetailComponent } from './property-detail.component';
import { PropertyService } from '../../core/services/property.service';
import { PropertyDetailResponse, PropertyImageResponse } from '../../core/models/property.model';

registerLocaleData(localeFrBe);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeImage(id: number, isPrimary = false): PropertyImageResponse {
  return { id, fileName: `photo-${id}.jpg`, contentType: 'image/jpeg', displayOrder: id, isPrimary };
}

function makeDetail(overrides: Partial<PropertyDetailResponse> = {}): PropertyDetailResponse {
  return {
    reference: 'IMM-001',
    title: 'Belle maison à Uccle',
    description: 'Une belle maison.',
    propertyType: 'HOUSE',
    transactionType: 'SALE',
    status: 'PUBLISHED',
    price: 485000,
    surface: 185,
    bedrooms: 4,
    bathrooms: 2,
    rooms: 7,
    floors: 2,
    constructionYear: 1978,
    energyRating: 'B',
    garden: true,
    garage: true,
    terrace: false,
    basement: true,
    elevator: false,
    furnished: false,
    street: 'Avenue Test',
    number: '42',
    postalCode: '1180',
    city: 'Uccle',
    province: 'BRUXELLES_CAPITALE',
    latitude: 50.7985,
    longitude: 4.3514,
    images: [],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
    ...overrides,
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('PropertyDetailComponent', () => {
  let fixture: ComponentFixture<PropertyDetailComponent>;
  let component: PropertyDetailComponent;
  let mockPropertyService: jasmine.SpyObj<PropertyService>;

  function createComponent(reference: string, detail?: PropertyDetailResponse): void {
    mockPropertyService.getPropertyByReference.and.returnValue(
      detail ? of(detail) : throwError(() => ({ status: 404 }))
    );
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: { get: () => reference } } },
    });
    fixture = TestBed.createComponent(PropertyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // déclenche ngOnInit
    tick(500);               // laisse le délai mock s'écouler
    fixture.detectChanges();
  }

  beforeEach(async () => {
    mockPropertyService = jasmine.createSpyObj<PropertyService>(
      'PropertyService',
      ['getPropertyByReference', 'getImageUrl'],
      {
        // Les signals doivent être de vraies instances Angular signal()
        searchParams: signal({}),
        isLoading: signal(false),
        results: signal(null),
        totalResults: signal(0),
      }
    );
    mockPropertyService.getImageUrl.and.callFake(
      (_ref: string, id: number) => `https://mock.img/${id}`
    );

    await TestBed.configureTestingModule({
      imports: [PropertyDetailComponent],
      providers: [
        provideRouter([]),
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: LOCALE_ID, useValue: 'fr-BE' },
      ],
    }).compileComponents();
  });

  // ─── Instanciation ─────────────────────────────────────────────────────────

  it('should create', fakeAsync(() => {
    createComponent('IMM-001', makeDetail());
    expect(component).toBeTruthy();
  }));

  // ─── Chargement réussi ──────────────────────────────────────────────────────

  it('should set property and clear isLoading on success', fakeAsync(() => {
    const detail = makeDetail();
    createComponent('IMM-001', detail);
    expect(component.isLoading()).toBeFalse();
    expect(component.property()).toEqual(detail);
    expect(component.notFound()).toBeFalse();
  }));

  // ─── 404 ────────────────────────────────────────────────────────────────────

  it('should set notFound on error response', fakeAsync(() => {
    createComponent('IMM-999');
    expect(component.notFound()).toBeTrue();
    expect(component.isLoading()).toBeFalse();
    expect(component.property()).toBeNull();
  }));

  // ─── Computed: typeLabel ────────────────────────────────────────────────────

  it('typeLabel should return "Maison" for HOUSE', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ propertyType: 'HOUSE' }));
    expect(component.typeLabel()).toBe('Maison');
  }));

  it('typeLabel should return "Appartement" for APARTMENT', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ propertyType: 'APARTMENT' }));
    expect(component.typeLabel()).toBe('Appartement');
  }));

  it('typeLabel should return raw value for unknown type', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ propertyType: 'UNKNOWN' }));
    expect(component.typeLabel()).toBe('UNKNOWN');
  }));

  // ─── Computed: isSale ───────────────────────────────────────────────────────

  it('isSale should be true for SALE', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ transactionType: 'SALE' }));
    expect(component.isSale()).toBeTrue();
  }));

  it('isSale should be false for RENT', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ transactionType: 'RENT' }));
    expect(component.isSale()).toBeFalse();
  }));

  // ─── Computed: energyLabel ──────────────────────────────────────────────────

  it('energyLabel should be null when no energyRating', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ energyRating: null }));
    expect(component.energyLabel()).toBeNull();
  }));

  it('energyLabel should format A_PLUS_PLUS as "A++"', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ energyRating: 'A_PLUS_PLUS' }));
    expect(component.energyLabel()).toBe('A++');
  }));

  it('energyLabel should format A_PLUS as "A+"', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ energyRating: 'A_PLUS' }));
    expect(component.energyLabel()).toBe('A+');
  }));

  it('energyLabel should return "B" for B rating', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ energyRating: 'B' }));
    expect(component.energyLabel()).toBe('B');
  }));

  // ─── Computed: fullAddress ──────────────────────────────────────────────────

  it('fullAddress should include street, number, postalCode and city', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({
      street: 'Rue de la Paix', number: '10', postalCode: '1000', city: 'Bruxelles',
    }));
    expect(component.fullAddress()).toBe('Rue de la Paix 10, 1000 Bruxelles');
  }));

  it('fullAddress should omit number when null', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({
      street: 'Rue des Charmes', number: null, postalCode: '5000', city: 'Namur',
    }));
    expect(component.fullAddress()).toBe('Rue des Charmes, 5000 Namur');
  }));

  // ─── Computed: hasImages ────────────────────────────────────────────────────

  it('hasImages should be false when images is empty', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ images: [] }));
    expect(component.hasImages()).toBeFalse();
  }));

  it('hasImages should be true when images has at least one entry', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ images: [makeImage(1)] }));
    expect(component.hasImages()).toBeTrue();
  }));

  // ─── Computed: amenities ────────────────────────────────────────────────────

  it('amenities should be empty when no feature is enabled', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({
      garden: false, garage: false, terrace: false,
      basement: false, elevator: false, furnished: false,
    }));
    expect(component.amenities().length).toBe(0);
  }));

  it('amenities should contain Jardin and Garage when enabled', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({
      garden: true, garage: true, terrace: false,
      basement: false, elevator: false, furnished: false,
    }));
    const labels = component.amenities().map((a) => a.label);
    expect(labels).toContain('Jardin');
    expect(labels).toContain('Garage');
    expect(labels.length).toBe(2);
  }));

  it('amenities should contain all 6 when all features enabled', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({
      garden: true, garage: true, terrace: true,
      basement: true, elevator: true, furnished: true,
    }));
    expect(component.amenities().length).toBe(6);
  }));

  // ─── Galerie : navigation ───────────────────────────────────────────────────

  describe('gallery navigation', () => {
    const images = [makeImage(1, true), makeImage(2), makeImage(3)];

    it('activeImageIndex should start at 0', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      expect(component.activeImageIndex()).toBe(0);
    }));

    it('setActiveImage() should update the index', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      component.setActiveImage(2);
      expect(component.activeImageIndex()).toBe(2);
    }));

    it('nextImage() should advance the index', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      component.nextImage();
      expect(component.activeImageIndex()).toBe(1);
    }));

    it('nextImage() should wrap around from last to first', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      component.setActiveImage(2);
      component.nextImage();
      expect(component.activeImageIndex()).toBe(0);
    }));

    it('prevImage() should go back', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      component.setActiveImage(1);
      component.prevImage();
      expect(component.activeImageIndex()).toBe(0);
    }));

    it('prevImage() should wrap around from first to last', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      component.prevImage();
      expect(component.activeImageIndex()).toBe(2);
    }));

    it('nextImage() should do nothing when only 1 image', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images: [makeImage(1, true)] }));
      component.nextImage();
      expect(component.activeImageIndex()).toBe(0);
    }));

    it('prevImage() should do nothing when only 1 image', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images: [makeImage(1, true)] }));
      component.prevImage();
      expect(component.activeImageIndex()).toBe(0);
    }));
  });

  // ─── Galerie : activeImageUrl ────────────────────────────────────────────────

  it('activeImageUrl should be null when no images', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ images: [] }));
    expect(component.activeImageUrl()).toBeNull();
  }));

  it('activeImageUrl should call getImageUrl with correct args', fakeAsync(() => {
    createComponent('IMM-001', makeDetail({ images: [makeImage(42, true)] }));
    expect(mockPropertyService.getImageUrl).toHaveBeenCalledWith('IMM-001', 42);
    expect(component.activeImageUrl()).toBe('https://mock.img/42');
  }));

  // ─── Navigation clavier ─────────────────────────────────────────────────────

  describe('keyboard navigation', () => {
    const images = [makeImage(1, true), makeImage(2), makeImage(3)];

    it('ArrowRight should call nextImage()', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      const spy = spyOn(component, 'nextImage').and.callThrough();
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      component.onKeydown(event);
      expect(spy).toHaveBeenCalled();
      expect(component.activeImageIndex()).toBe(1);
    }));

    it('ArrowLeft should call prevImage()', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      const spy = spyOn(component, 'prevImage').and.callThrough();
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      component.onKeydown(event);
      expect(spy).toHaveBeenCalled();
      expect(component.activeImageIndex()).toBe(2); // wrap-around
    }));

    it('other keys should not change the index', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images }));
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.activeImageIndex()).toBe(0);
    }));

    it('keyboard navigation should do nothing when only 1 image', fakeAsync(() => {
      createComponent('IMM-001', makeDetail({ images: [makeImage(1, true)] }));
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(component.activeImageIndex()).toBe(0);
    }));
  });

  // ─── getImageUrl (wrapper) ──────────────────────────────────────────────────

  it('getImageUrl() should delegate to propertyService', fakeAsync(() => {
    createComponent('IMM-001', makeDetail());
    const url = component.getImageUrl('IMM-001', 99);
    expect(mockPropertyService.getImageUrl).toHaveBeenCalledWith('IMM-001', 99);
    expect(url).toBe('https://mock.img/99');
  }));
});
