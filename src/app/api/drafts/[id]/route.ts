import { actorId, assertSameOrigin, readJson, respond } from "@/server/http";
import { getStore } from "@/server/store";
export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    assertSameOrigin(request);
    return getStore().update(await actorId(), (await context.params).id, await readJson(request));
  });
}
