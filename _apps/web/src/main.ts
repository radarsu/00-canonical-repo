import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideUi } from "@app_/ui";
import { AppComponent } from "./app/app.component";
import { APP_ROUTES } from "./app/app.routes";

// Zoneless (Angular 21 GA default for new apps): no zone.js polyfill, change detection driven by signals +
// events. Components are OnPush and use signals throughout — see the notes/login pages.
bootstrapApplication(AppComponent, {
    providers: [provideZonelessChangeDetection(), provideRouter(APP_ROUTES), provideUi()],
}).catch((error: unknown) => console.error(error));
