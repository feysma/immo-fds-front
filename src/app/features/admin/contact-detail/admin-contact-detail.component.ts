import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AdminContactService } from '../../../core/services/admin-contact.service';
import { AuthService } from '../../../core/services/auth.service';
import { ContactNoteResponse, ContactRequestResponse } from '../../../core/models/property.model';

const CONTACT_TYPE_LABELS: Record<string, string> = {
  VISIT_REQUEST:   'Demande de visite',
  GENERAL_CONTACT: 'Contact général',
  SELL_YOUR_HOME:  'Vendre mon bien',
};

const CONTACT_TYPE_CLASSES: Record<string, string> = {
  VISIT_REQUEST:   'bg-primary-50 text-primary-700',
  GENERAL_CONTACT: 'bg-gray-100 text-gray-600',
  SELL_YOUR_HOME:  'bg-amber-50 text-amber-700',
};

const STATUS_LABELS: Record<string, string> = {
  NEW:         'Nouveau',
  IN_PROGRESS: 'En cours',
  CLOSED:      'Clôturé',
};

const STATUS_CLASSES: Record<string, string> = {
  NEW:         'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLOSED:      'bg-gray-100 text-gray-500',
};

// Transitions de statut valides
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW:         ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['CLOSED'],
  CLOSED:      ['NEW'],
};

@Component({
  selector: 'app-admin-contact-detail',
  imports: [DatePipe],
  templateUrl: './admin-contact-detail.component.html',
  styleUrl: './admin-contact-detail.component.scss',
})
export class AdminContactDetailComponent implements OnInit {
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly adminContactService = inject(AdminContactService);
  private readonly authService         = inject(AuthService);

  readonly currentUser = this.authService.currentUser;

  readonly isLoading = signal(true);
  readonly contact   = signal<ContactRequestResponse | null>(null);
  readonly notFound  = signal(false);

  // ── Statut ────────────────────────────────────────────────────────────────

  readonly pendingStatus     = signal<string | null>(null);
  readonly isUpdatingStatus  = signal(false);
  readonly statusError       = signal<string | null>(null);

  readonly availableTransitions = computed(() => {
    const c = this.contact();
    return c ? (VALID_STATUS_TRANSITIONS[c.status] ?? []) : [];
  });

  // ── Notes ─────────────────────────────────────────────────────────────────

  readonly notes = computed(() => this.contact()?.notes ?? []);

  readonly lastNote = computed(() => {
    const n = this.notes();
    return n.length > 0 ? n[n.length - 1] : null;
  });

  readonly canEditLastNote = computed(() => {
    const last = this.lastNote();
    const user = this.currentUser();
    return last !== null && user !== null && last.authorId === user.id;
  });

  // Ajout de note
  readonly newNoteContent = signal('');
  readonly isAddingNote   = signal(false);
  readonly isSavingNote   = signal(false);

  // Édition de la dernière note
  readonly editingNoteId      = signal<number | null>(null);
  readonly editingNoteContent = signal('');
  readonly isSavingEdit       = signal(false);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/contacts']); return; }

    this.adminContactService.getContact(id).subscribe({
      next: (c) => {
        this.contact.set(c);
        this.isLoading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  typeLabel(type: string): string { return CONTACT_TYPE_LABELS[type] ?? type; }
  typeClass(type: string): string { return CONTACT_TYPE_CLASSES[type] ?? 'bg-gray-100 text-gray-500'; }
  statusLabel(s: string): string  { return STATUS_LABELS[s] ?? s; }
  statusClass(s: string): string  { return STATUS_CLASSES[s] ?? 'bg-gray-100 text-gray-500'; }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/admin/contacts']);
  }

  // ── Changement de statut ──────────────────────────────────────────────────

  requestStatusChange(newStatus: string): void {
    this.pendingStatus.set(newStatus);
    this.statusError.set(null);
  }

  cancelStatusChange(): void {
    this.pendingStatus.set(null);
  }

  confirmStatusChange(): void {
    const newStatus = this.pendingStatus();
    const id = this.contact()?.id;
    if (!newStatus || !id) return;

    this.isUpdatingStatus.set(true);
    this.adminContactService.updateStatus(id, newStatus).subscribe({
      next: (updated) => {
        this.contact.set(updated);
        this.pendingStatus.set(null);
        this.isUpdatingStatus.set(false);
      },
      error: () => {
        this.statusError.set('Erreur lors de la mise à jour du statut.');
        this.isUpdatingStatus.set(false);
      },
    });
  }

  // ── Ajout d'une note ──────────────────────────────────────────────────────

  openAddNote(): void {
    this.newNoteContent.set('');
    this.isAddingNote.set(true);
  }

  cancelAddNote(): void {
    this.isAddingNote.set(false);
  }

  submitAddNote(): void {
    const content = this.newNoteContent().trim();
    const id = this.contact()?.id;
    if (!content || !id) return;

    this.isSavingNote.set(true);
    this.adminContactService.addNote(id, content).subscribe({
      next: (newNote) => {
        this.contact.update((c) => c ? { ...c, notes: [...c.notes, newNote] } : c);
        this.isAddingNote.set(false);
        this.newNoteContent.set('');
        this.isSavingNote.set(false);
      },
      error: () => this.isSavingNote.set(false),
    });
  }

  // ── Édition de la dernière note ───────────────────────────────────────────

  startEditNote(note: ContactNoteResponse): void {
    this.editingNoteId.set(note.id);
    this.editingNoteContent.set(note.content);
  }

  cancelEditNote(): void {
    this.editingNoteId.set(null);
  }

  submitEditNote(): void {
    const content   = this.editingNoteContent().trim();
    const noteId    = this.editingNoteId();
    const contactId = this.contact()?.id;
    if (!content || !noteId || !contactId) return;

    this.isSavingEdit.set(true);
    this.adminContactService.updateLastNote(contactId, noteId, content).subscribe({
      next: (updated) => {
        this.contact.update((c) => {
          if (!c) return c;
          return { ...c, notes: c.notes.map((n) => n.id === updated.id ? updated : n) };
        });
        this.editingNoteId.set(null);
        this.isSavingEdit.set(false);
      },
      error: () => this.isSavingEdit.set(false),
    });
  }
}
