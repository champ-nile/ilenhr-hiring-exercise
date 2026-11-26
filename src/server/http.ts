import { cookies } from "next/headers";
import { AppError, getStore } from "./store";

export async function actorId() {
  const id = (await cookies()).get("ilen-demo-actor")?.value || "aydan";
  getStore().requireEmployee(id);
  return id;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new AppError(403, "Cross-origin writes are not allowed.");
}

export async function readJson(request: Request) {
  try { return await request.json(); }
  catch { throw new AppError(400, "Send valid JSON."); }
}

export async function respond(work: () => unknown | Promise<unknown>, status = 200) {
  try { return Response.json(await work(), { status, headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    if (error instanceof AppError) return Response.json({ error: error.message }, { status: error.status });
    console.error(error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
