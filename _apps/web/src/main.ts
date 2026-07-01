import { installUi } from "@app_/ui";
import "primeicons/primeicons.css";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles.css";

// Composition API + a single design-system plugin. No zone.js / providers ceremony: the router and PrimeVue
// (via installUi) are the only app-wide wiring; state lives in composables (see composables/).
const app = createApp(App);
app.use(router);
installUi(app);
app.mount("#app");
