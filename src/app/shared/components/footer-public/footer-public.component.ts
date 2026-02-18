import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer-public',
  templateUrl: './footer-public.component.html',
})
export class FooterPublicComponent {
  /** true = thème sombre (fond bleu/gris de la home), false = thème clair (fond blanc) */
  @Input() dark = false;
  /** false = masque le lien "Accès administration" (utile sur les pages admin elles-mêmes) */
  @Input() showAdminLink = true;
}
