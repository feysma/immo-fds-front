import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PropertyCardComponent } from './property-card.component';
import { PropertyService } from '../../../core/services/property.service';
import { PropertySummaryResponse } from '../../../core/models/property.model';

/** Fabrique un PropertySummaryResponse minimal pour les tests. */
function makeProperty(overrides: Partial<PropertySummaryResponse> = {}): PropertySummaryResponse {
  return {
    reference: 'IMM-001',
    title: 'Belle maison à Uccle',
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
    ...overrides,
  };
}

describe('PropertyCardComponent', () => {
  let fixture: ComponentFixture<PropertyCardComponent>;
  let component: PropertyCardComponent;
  let router: Router;

  const mockPropertyService = jasmine.createSpyObj<PropertyService>(
    'PropertyService',
    ['getImageUrl'],
    {
      searchParams: signal({}),
      isLoading: signal(false),
      results: signal(null),
      totalResults: signal(0),
    }
  );
  mockPropertyService.getImageUrl.and.callFake(
    (_ref: string, id: number) => `https://mock.img/${id}`
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyCardComponent],
      providers: [
        provideRouter([]),
        { provide: PropertyService, useValue: mockPropertyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyCardComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  function setProperty(p: PropertySummaryResponse): void {
    fixture.componentRef.setInput('property', p);
    fixture.detectChanges();
  }

  // ─── Instanciation ─────────────────────────────────────────────────────────

  it('should create', () => {
    setProperty(makeProperty());
    expect(component).toBeTruthy();
  });

  // ─── Affichage du titre et du prix ─────────────────────────────────────────

  it('should display the property title', () => {
    setProperty(makeProperty({ title: 'Superbe villa' }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Superbe villa');
  });

  it('should display the city', () => {
    setProperty(makeProperty({ city: 'Liège' }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Liège');
  });

  // ─── typeLabel ──────────────────────────────────────────────────────────────

  it('typeLabel should return "Maison" for HOUSE', () => {
    setProperty(makeProperty({ propertyType: 'HOUSE' }));
    expect(component.typeLabel).toBe('Maison');
  });

  it('typeLabel should return "Appartement" for APARTMENT', () => {
    setProperty(makeProperty({ propertyType: 'APARTMENT' }));
    expect(component.typeLabel).toBe('Appartement');
  });

  it('typeLabel should fall back to the raw value for unknown type', () => {
    setProperty(makeProperty({ propertyType: 'UNKNOWN' }));
    expect(component.typeLabel).toBe('UNKNOWN');
  });

  // ─── isSale ─────────────────────────────────────────────────────────────────

  it('isSale should be true for SALE', () => {
    setProperty(makeProperty({ transactionType: 'SALE' }));
    expect(component.isSale).toBeTrue();
  });

  it('isSale should be false for RENT', () => {
    setProperty(makeProperty({ transactionType: 'RENT' }));
    expect(component.isSale).toBeFalse();
  });

  // ─── Badge transaction ──────────────────────────────────────────────────────

  it('should display "Vente" badge for SALE', () => {
    setProperty(makeProperty({ transactionType: 'SALE' }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Vente');
  });

  it('should display "Location" badge for RENT', () => {
    setProperty(makeProperty({ transactionType: 'RENT' }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Location');
  });

  // ─── PEB badge ──────────────────────────────────────────────────────────────

  it('should display energy rating badge when provided', () => {
    setProperty(makeProperty({ energyRating: 'B' }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('PEB B');
  });

  it('should not display PEB badge when energyRating is null', () => {
    setProperty(makeProperty({ energyRating: null }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('PEB');
  });

  // ─── Surface / chambres ─────────────────────────────────────────────────────

  it('should display surface when provided', () => {
    setProperty(makeProperty({ surface: 185 }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('185');
  });

  it('should not display surface chip when surface is null', () => {
    setProperty(makeProperty({ surface: null }));
    // Le chip "m²" ne doit pas apparaître
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('m²');
  });

  it('should display bedroom count when provided', () => {
    setProperty(makeProperty({ bedrooms: 4 }));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('4');
  });

  // ─── Image / placeholder ────────────────────────────────────────────────────

  it('should show img tag when primaryImageId is set', () => {
    setProperty(makeProperty({ primaryImageId: 101 }));
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
  });

  it('should show placeholder when primaryImageId is null', () => {
    setProperty(makeProperty({ primaryImageId: null }));
    const img = fixture.debugElement.query(By.css('img'));
    // Pas d'image réelle → le composant placeholder est affiché
    expect(img).toBeFalsy();
    const placeholder = fixture.debugElement.query(By.css('app-property-placeholder'));
    expect(placeholder).toBeTruthy();
  });

  // ─── Navigation ─────────────────────────────────────────────────────────────

  it('navigateToDetail() should navigate to /properties/:reference', async () => {
    setProperty(makeProperty({ reference: 'IMM-042' }));
    const navigateSpy = spyOn(router, 'navigate');
    component.navigateToDetail();
    expect(navigateSpy).toHaveBeenCalledWith(['/properties', 'IMM-042']);
  });

  it('should call navigateToDetail() on article click', () => {
    setProperty(makeProperty());
    const navigateSpy = spyOn(component, 'navigateToDetail');
    const article = fixture.debugElement.query(By.css('article'));
    article.triggerEventHandler('click', null);
    expect(navigateSpy).toHaveBeenCalled();
  });
});
