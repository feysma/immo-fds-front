import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PropertyPlaceholderComponent } from './property-placeholder.component';

/**
 * Tests pour PropertyPlaceholderComponent.
 * Vérifie que le bon SVG est rendu pour chaque type de bien,
 * et que la classe Tailwind est correctement appliquée.
 */
describe('PropertyPlaceholderComponent', () => {
  let fixture: ComponentFixture<PropertyPlaceholderComponent>;
  let component: PropertyPlaceholderComponent;

  function setInputs(propertyType: string, svgClass = 'w-16 h-16'): void {
    fixture.componentRef.setInput('propertyType', propertyType);
    fixture.componentRef.setInput('svgClass', svgClass);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyPlaceholderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyPlaceholderComponent);
    component = fixture.componentInstance;
  });

  // ─── Instanciation ─────────────────────────────────────────────────────────

  it('should create', () => {
    setInputs('HOUSE');
    expect(component).toBeTruthy();
  });

  // ─── Input propertyType ─────────────────────────────────────────────────────

  it('should render an SVG element for HOUSE', () => {
    setInputs('HOUSE');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for APARTMENT', () => {
    setInputs('APARTMENT');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for STUDIO', () => {
    setInputs('STUDIO');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for LOFT', () => {
    setInputs('LOFT');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for LAND', () => {
    setInputs('LAND');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for OFFICE', () => {
    setInputs('OFFICE');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for WAREHOUSE', () => {
    setInputs('WAREHOUSE');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for GARAGE', () => {
    setInputs('GARAGE');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render an SVG element for PARKING_SPOT', () => {
    setInputs('PARKING_SPOT');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  it('should render a fallback SVG for unknown type', () => {
    setInputs('UNKNOWN_TYPE');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg).toBeTruthy();
  });

  // ─── Input svgClass ─────────────────────────────────────────────────────────

  it('should apply the default svgClass "w-16 h-16" to the SVG', () => {
    setInputs('HOUSE', 'w-16 h-16');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg.nativeElement.classList).toContain('w-16');
    expect(svg.nativeElement.classList).toContain('h-16');
  });

  it('should apply a custom svgClass to the SVG', () => {
    setInputs('HOUSE', 'w-20 h-20');
    const svg = fixture.debugElement.query(By.css('svg'));
    expect(svg.nativeElement.classList).toContain('w-20');
    expect(svg.nativeElement.classList).toContain('h-20');
  });

  it('should update the svgClass when input changes', () => {
    setInputs('HOUSE', 'w-10 h-10');
    let svg = fixture.debugElement.query(By.css('svg'));
    expect(svg.nativeElement.classList).toContain('w-10');

    setInputs('HOUSE', 'w-24 h-24');
    svg = fixture.debugElement.query(By.css('svg'));
    expect(svg.nativeElement.classList).toContain('w-24');
  });

  // ─── Signal inputs ──────────────────────────────────────────────────────────

  it('should update SVG when propertyType changes', () => {
    setInputs('HOUSE');
    const svgHouse = fixture.debugElement.query(By.css('svg'));
    const pathHouse = svgHouse.query(By.css('path'))?.nativeElement.getAttribute('d');

    setInputs('LAND');
    const svgLand = fixture.debugElement.query(By.css('svg'));
    const pathLand = svgLand.query(By.css('path'))?.nativeElement.getAttribute('d');

    // Les deux types doivent avoir des SVG distincts
    expect(pathHouse).not.toEqual(pathLand);
  });
});
