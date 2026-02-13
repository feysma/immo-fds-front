import { Component, input } from '@angular/core';

@Component({
  selector: 'app-property-placeholder',
  templateUrl: './property-placeholder.component.html',
})
export class PropertyPlaceholderComponent {
  readonly propertyType = input.required<string>();
  /** Classes Tailwind pour la taille du SVG (ex: 'w-16 h-16' ou 'w-20 h-20') */
  readonly svgClass = input('w-16 h-16');
}
