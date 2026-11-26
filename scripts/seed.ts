import { getStore } from "../src/server/store";
const store = getStore();
console.log(`Database ready: ${store.employees().length} demo employees. Existing data preserved.`);
store.close();
