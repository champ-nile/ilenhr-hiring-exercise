import { actorId, assertSameOrigin, readJson, respond } from "@/server/http";
import { getStore } from "@/server/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return respond(async () => {
    assertSameOrigin(request);
    return getStore().create(await actorId(), await readJson(request));
  }, 201);
}
