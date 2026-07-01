import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import type { Note } from "@app_/api-contract";
import { CardComponent, PageComponent } from "@app_/ui";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ApiService } from "../core/api.service";
import { AuthService } from "../core/auth.service";

@Component({
    selector: `app-notes`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ButtonModule, InputTextModule, CardComponent, PageComponent],
    template: `
        <ui-page>
            <header class="mb-4 flex items-center justify-between">
                <h1 class="text-xl font-semibold">Notes</h1>
                <div class="flex items-center gap-3 text-sm">
                    <span class="text-surface-500">{{ auth.user()?.email }}</span>
                    <button type="button" class="text-primary-600 hover:underline" (click)="signOut()">Sign out</button>
                </div>
            </header>

            <form class="mb-4 flex gap-2" (ngSubmit)="add()">
                <input pInputText class="flex-1" placeholder="New note title…" [(ngModel)]="title" name="title" />
                <p-button type="submit" label="Add" [loading]="busy()" [disabled]="!title.trim()" />
            </form>

            <div class="flex flex-col gap-2">
                @for (note of notes(); track note.id) {
                    <ui-card>
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="font-medium">{{ note.title }}</p>
                                @if (note.body) {
                                    <p class="text-sm text-surface-500">{{ note.body }}</p>
                                }
                            </div>
                            <button type="button" class="text-sm text-red-500 hover:underline" (click)="remove(note)">Delete</button>
                        </div>
                    </ui-card>
                } @empty {
                    <ui-card [dashed]="true">
                        <p class="text-center text-sm text-surface-500">No notes yet — add your first above.</p>
                    </ui-card>
                }
            </div>
        </ui-page>
    `,
})
export class NotesComponent implements OnInit {
    private readonly api = inject(ApiService);
    private readonly router = inject(Router);
    readonly auth = inject(AuthService);

    readonly notes = signal<Note[]>([]);
    readonly busy = signal(false);
    title = ``;

    async ngOnInit(): Promise<void> {
        this.notes.set(await this.api.client.notes.list());
    }

    async add(): Promise<void> {
        const title = this.title.trim();
        if (!title) {
            return;
        }
        this.busy.set(true);
        try {
            const note = await this.api.client.notes.create({ title, body: `` });
            this.notes.update((current) => [note, ...current]);
            this.title = ``;
        } finally {
            this.busy.set(false);
        }
    }

    async remove(note: Note): Promise<void> {
        await this.api.client.notes.remove({ id: note.id });
        this.notes.update((current) => current.filter((n) => n.id !== note.id));
    }

    async signOut(): Promise<void> {
        await this.auth.signOut();
        await this.router.navigateByUrl(`/login`);
    }
}
