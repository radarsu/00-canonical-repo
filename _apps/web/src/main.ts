import { installUi } from "@app_/ui";
import { VueQueryPlugin } from "@tanstack/vue-query";
import "primeicons/primeicons.css";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles.css";

// Composition API + a single design-system plugin. No zone.js / providers ceremony: the router, PrimeVue
// (via installUi), and vue-query are the only app-wide wiring; server state lives in useQuery/useMutation,
// client state in composables (see composables/).
const app = createApp(App);
app.use(router);
app.use(VueQueryPlugin);
installUi(app);
app.mount("#app");
