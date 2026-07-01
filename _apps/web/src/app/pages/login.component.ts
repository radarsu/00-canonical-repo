import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CardComponent, PageComponent } from "@app_/ui";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { AuthService } from "../core/auth.service";

@Component({
    selector: `app-login`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ButtonModule, InputTextModule, CardComponent, PageComponent],
    template: `
        <ui-page>
            <ui-card>
                <h1 class="mb-4 text-xl font-semibold">{{ mode() === "signin" ? "Sign in" : "Create account" }}</h1>
                <form class="flex flex-col gap-3" (ngSubmit)="submit()">
                    @if (mode() === "signup") {
                        <input pInputText placeholder="Name" [(ngModel)]="name" name="name" autocomplete="name" />
                    }
                    <input pInputText placeholder="Email" type="email" [(ngModel)]="email" name="email" autocomplete="email" />
                    <input pInputText placeholder="Password" type="password" [(ngModel)]="password" name="password" autocomplete="current-password" />
                    @if (error()) {
                        <p class="text-sm text-red-500">{{ error() }}</p>
                    }
                    <p-button type="submit" [label]="mode() === 'signin' ? 'Sign in' : 'Sign up'" [loading]="busy()" />
                </form>
                <button type="button" class="mt-3 text-sm text-primary-600 hover:underline" (click)="toggle()">
                    {{ mode() === "signin" ? "Need an account? Sign up" : "Have an account? Sign in" }}
                </button>
            </ui-card>
        </ui-page>
    `,
})
export class LoginComponent {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    readonly mode = signal<`signin` | `signup`>(`signin`);
    readonly busy = signal(false);
    readonly error = signal(``);

    name = ``;
    email = ``;
    password = ``;

    toggle(): void {
        this.mode.update((m) => (m === `signin` ? `signup` : `signin`));
        this.error.set(``);
    }

    async submit(): Promise<void> {
        this.busy.set(true);
        this.error.set(``);
        try {
            if (this.mode() === `signin`) {
                await this.auth.signIn(this.email, this.password);
            } else {
                await this.auth.signUp(this.name, this.email, this.password);
            }
            await this.router.navigateByUrl(`/`);
        } catch (error) {
            this.error.set(error instanceof Error ? error.message : `Something went wrong`);
        } finally {
            this.busy.set(false);
        }
    }
}
