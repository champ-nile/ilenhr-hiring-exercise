import { actorId, respond } from "@/server/http";
import { getStore } from "@/server/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return respond(async () => {
    const id = await actorId(); const store = getStore();
    return { actor: store.requireEmployee(id), employees: store.employees(), drafts: store.drafts(id) };
  });
}
