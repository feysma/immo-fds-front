import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  AdminPropertyService,
  PropertyUpdateRequest,
  VALID_STATUS_TRANSITIONS,
} from '../../../core/services/admin-property.service';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyDetailResponse, EnumValueResponse } from '../../../core/models/property.model';
import { PropertyPlaceholderComponent } from '../../../shared/components/property-placeholder/property-placeholder.component';

const STATUS_LABELS: Record<string, string> = {
  DRAFT:     'Brouillon',
  PUBLISHED: 'Publié',
  SOLD:      'Vendu',
  RENTED:    'Loué',
  ARCHIVED:  'Archivé',
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  SOLD:      'bg-blue-100 text-blue-700',
  RENTED:    'bg-violet-100 text-violet-700',
  ARCHIVED:  'bg-amber-100 text-amber-700',
};

const ENERGY_LABELS: Record<string, string> = {
  A_PLUS_PLUS: 'A++', A_PLUS: 'A+', A: 'A', B: 'B',
  C: 'C', D: 'D', E: 'E', F: 'F', G: 'G',
};

@Component({
  selector: 'app-admin-property-edit',
  imports: [ReactiveFormsModule, DatePipe, PropertyPlaceholderComponent],
  templateUrl: './admin-property-edit.component.html',
  styleUrl: './admin-property-edit.component.scss',
})
export class AdminPropertyEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminPropertyService);
  private readonly propertyService = inject(PropertyService);

  // ─── État ─────────────────────────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly isSaving = signal(false);
  readonly isStatusUpdating = signal(false);
  readonly isDeleting = signal(false);
  readonly saveSuccess = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly pendingStatus = signal<string | null>(null);

  readonly property = signal<PropertyDetailResponse | null>(null);
  readonly propertyTypes = signal<EnumValueResponse[]>([]);
  readonly provinces = signal<EnumValueResponse[]>([]);

  readonly currentStatus = computed(() => this.property()?.status ?? '');
  readonly availableTransitions = computed(() => {
    const transitions = VALID_STATUS_TRANSITIONS[this.currentStatus()] ?? [];
    const transactionType = this.property()?.transactionType;
    return transitions.filter((s) => {
      if (s === 'SOLD')   return transactionType === 'SALE';
      if (s === 'RENTED') return transactionType === 'RENT';
      return true;
    });
  });
  readonly statusLabel = computed(() => STATUS_LABELS[this.currentStatus()] ?? this.currentStatus());
  readonly statusClass = computed(() => STATUS_CLASSES[this.currentStatus()] ?? 'bg-gray-100 text-gray-500');
  readonly isArchived = computed(() => this.currentStatus() === 'ARCHIVED');

  readonly energyRatingOptions = Object.entries(ENERGY_LABELS).map(([value, label]) => ({ value, label }));
  readonly statusTransitionLabels = STATUS_LABELS;

  // ─── État images ──────────────────────────────────────────────────────────
  readonly isUploadingImage   = signal(false);
  readonly uploadError        = signal<string | null>(null);
  readonly isDeletingImageId  = signal<number | null>(null);
  readonly isSettingPrimaryId = signal<number | null>(null);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // ─── Formulaire ───────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    // Infos principales
    title:           ['', Validators.required],
    description:     [''],
    propertyType:    ['', Validators.required],
    transactionType: ['', Validators.required],
    price:           [null as number | null, [Validators.required, Validators.min(1)]],
    // Caractéristiques
    surface:          [null as number | null],
    bedrooms:         [null as number | null],
    bathrooms:        [null as number | null],
    rooms:            [null as number | null],
    floors:           [null as number | null],
    constructionYear: [null as number | null],
    energyRating:     [''],
    // Équipements (booléens)
    garden:   [false],
    garage:   [false],
    terrace:  [false],
    basement: [false],
    elevator: [false],
    furnished:[false],
    // Localisation
    street:     ['', Validators.required],
    number:     [''],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    city:       ['', Validators.required],
    province:   ['', Validators.required],
    latitude:   [null as number | null],
    longitude:  [null as number | null],
  });

  ngOnInit(): void {
    const reference = this.route.snapshot.paramMap.get('reference')!;
    this.adminService.getPropertyTypes().subscribe((t) => this.propertyTypes.set(t));
    this.adminService.getProvinces().subscribe((p) => this.provinces.set(p));
    this.adminService.getPropertyByReference(reference).subscribe({
      next: (p) => {
        this.property.set(p);
        this.populateForm(p);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 404) this.notFound.set(true);
      },
    });
  }

  private populateForm(p: PropertyDetailResponse): void {
    this.form.patchValue({
      title:           p.title,
      description:     p.description ?? '',
      propertyType:    p.propertyType,
      transactionType: p.transactionType,
      price:           p.price,
      surface:         p.surface,
      bedrooms:        p.bedrooms,
      bathrooms:       p.bathrooms,
      rooms:           p.rooms,
      floors:          p.floors,
      constructionYear:p.constructionYear,
      energyRating:    p.energyRating ?? '',
      garden:          p.garden,
      garage:          p.garage,
      terrace:         p.terrace,
      basement:        p.basement,
      elevator:        p.elevator,
      furnished:       p.furnished,
      street:          p.street,
      number:          p.number ?? '',
      postalCode:      p.postalCode,
      city:            p.city,
      province:        p.province,
      latitude:        p.latitude,
      longitude:       p.longitude,
    });
  }

  // ─── Sauvegarde ───────────────────────────────────────────────────────────
  onSave(): void {
    if (this.form.invalid || this.isSaving()) return;
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.isSaving.set(true);

    const f = this.form.getRawValue();
    const reference = this.property()!.reference;

    const body: PropertyUpdateRequest = {
      title:           f.title!,
      description:     f.description || undefined,
      propertyType:    f.propertyType!,
      transactionType: f.transactionType!,
      price:           f.price!,
      surface:         f.surface,
      bedrooms:        f.bedrooms,
      bathrooms:       f.bathrooms,
      rooms:           f.rooms,
      floors:          f.floors,
      constructionYear:f.constructionYear,
      energyRating:    f.energyRating || null,
      garden:          f.garden!,
      garage:          f.garage!,
      terrace:         f.terrace!,
      basement:        f.basement!,
      elevator:        f.elevator!,
      furnished:       f.furnished!,
      street:          f.street!,
      number:          f.number || null,
      postalCode:      f.postalCode!,
      city:            f.city!,
      province:        f.province!,
      latitude:        f.latitude,
      longitude:       f.longitude,
    };

    this.adminService.updateProperty(reference, body).subscribe({
      next: (updated) => {
        this.property.set(updated);
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('Une erreur est survenue lors de la sauvegarde.');
      },
    });
  }

  // ─── Changement de statut ─────────────────────────────────────────────────
  requestStatusChange(newStatus: string): void {
    this.pendingStatus.set(newStatus);
  }

  cancelStatusChange(): void {
    this.pendingStatus.set(null);
  }

  confirmStatusChange(): void {
    const newStatus = this.pendingStatus();
    if (!newStatus || this.isStatusUpdating()) return;
    this.isStatusUpdating.set(true);
    this.pendingStatus.set(null);
    const reference = this.property()!.reference;
    this.adminService.updateStatus(reference, newStatus).subscribe({
      next: (updated) => {
        this.property.set(updated);
        this.isStatusUpdating.set(false);
      },
      error: () => this.isStatusUpdating.set(false),
    });
  }

  // ─── Suppression ─────────────────────────────────────────────────────────
  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  onDelete(): void {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);
    const reference = this.property()!.reference;
    this.adminService.deleteProperty(reference).subscribe({
      next: () => {
        this.router.navigate(['/admin/properties']);
      },
      error: () => this.isDeleting.set(false),
    });
  }

  // ─── Gestion des images ───────────────────────────────────────────────────

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.uploadError.set('Format non supporté. Utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.uploadError.set('Fichier trop volumineux (max 10 Mo).');
      return;
    }

    this.uploadError.set(null);
    this.isUploadingImage.set(true);
    const reference = this.property()!.reference;
    const isFirst = this.property()!.images.length === 0;

    this.adminService.uploadImage(reference, file, isFirst).subscribe({
      next: (newImg) => {
        this.property.update((p) => p ? { ...p, images: [...p.images, newImg] } : p);
        this.isUploadingImage.set(false);
      },
      error: () => {
        this.uploadError.set("Erreur lors de l'upload de l'image.");
        this.isUploadingImage.set(false);
      },
    });
  }

  onDeleteImage(imageId: number): void {
    if (this.isDeletingImageId()) return;
    this.isDeletingImageId.set(imageId);
    const reference = this.property()!.reference;

    this.adminService.deleteImage(reference, imageId).subscribe({
      next: () => {
        this.property.update((p) =>
          p ? { ...p, images: p.images.filter((i) => i.id !== imageId) } : p
        );
        this.isDeletingImageId.set(null);
      },
      error: () => this.isDeletingImageId.set(null),
    });
  }

  onSetPrimary(imageId: number): void {
    if (this.isSettingPrimaryId()) return;
    this.isSettingPrimaryId.set(imageId);
    const reference = this.property()!.reference;

    this.adminService.setPrimaryImage(reference, imageId).subscribe({
      next: () => {
        this.property.update((p) =>
          p ? { ...p, images: p.images.map((i) => ({ ...i, isPrimary: i.id === imageId })) } : p
        );
        this.isSettingPrimaryId.set(null);
      },
      error: () => this.isSettingPrimaryId.set(null),
    });
  }

  onMoveImage(index: number, direction: -1 | 1): void {
    const images = this.property()?.images;
    if (!images) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const updated = reordered.map((img, i) => ({ ...img, displayOrder: i }));

    this.property.update((p) => p ? { ...p, images: updated } : p);
    this.adminService.reorderImages(this.property()!.reference, updated.map((i) => i.id)).subscribe();
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/admin/properties']);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  imageUrl(reference: string, imageId: number): string {
    return this.propertyService.getImageUrl(reference, imageId);
  }

  typeLabel(value: string): string {
    return this.propertyTypes().find((t) => t.value === value)?.label ?? value;
  }

  provinceLabel(value: string): string {
    return this.provinces().find((p) => p.value === value)?.label ?? value;
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
