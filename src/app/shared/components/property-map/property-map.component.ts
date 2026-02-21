import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  input,
  NgZone,
  inject,
} from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-property-map',
  imports: [],
  templateUrl: './property-map.component.html',
  styleUrl: './property-map.component.scss',
})
export class PropertyMapComponent implements AfterViewInit, OnDestroy {
  readonly latitude  = input.required<number>();
  readonly longitude = input.required<number>();
  readonly title     = input<string>('');

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;

  private readonly ngZone = inject(NgZone);
  private map: mapboxgl.Map | null = null;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      mapboxgl.accessToken = environment.mapboxAccessToken;

      const lng = this.longitude();
      const lat = this.latitude();

      this.map = new mapboxgl.Map({
        container: this.mapContainer.nativeElement,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 15,
      });

      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      this.map.on('load', () => {
        // Marqueur custom HTML — indépendant du CSS Mapbox
        const el = document.createElement('div');
        el.style.cssText = [
          'width: 22px',
          'height: 22px',
          'background-color: #1e4fa0',
          'border: 3px solid #ffffff',
          'border-radius: 50%',
          'box-shadow: 0 2px 8px rgba(0,0,0,0.45)',
          'cursor: pointer',
        ].join(';');

        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false })
          .setText(this.title() || `${lat}, ${lng}`);

        new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(this.map!);

        this.map!.resize();
      });
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }
}
