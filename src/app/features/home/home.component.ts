import { Component } from '@angular/core';
import { SearchFormComponent } from './components/search-form/search-form.component';
import { FooterPublicComponent } from '../../shared/components/footer-public/footer-public.component';

@Component({
  selector: 'app-home',
  imports: [SearchFormComponent, FooterPublicComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly stats = [
    { value: '500+', label: 'Biens disponibles' },
    { value: '11', label: 'Provinces couvertes' },
    { value: '98%', label: 'Clients satisfaits' },
  ];
}
