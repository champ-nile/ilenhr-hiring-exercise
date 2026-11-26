import { cookies } from "next/headers";
import { assertSameOrigin, readJson, respond } from "@/server/http";
import { AppError, getStore } from "@/server/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return respond(async () => {
    assertSameOrigin(request);
    const value = await readJson(request);
    if (!value || typeof value.employeeId !== "string") throw new AppError(400, "Choose a demo employee.");
    const actor = getStore().requireEmployee(value.employeeId);
    (await cookies()).set("ilen-demo-actor", actor.id, { httpOnly: true, sameSite: "strict", path: "/", secure: new URL(request.url).protocol === "https:" });
    return { actor };
  });
}
