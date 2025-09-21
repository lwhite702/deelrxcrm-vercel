import { NextResponse } from "next/server";

export async function parseJson<T = unknown>(req: Request): Promise<T> {
  const text = await req.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw badRequest("Invalid JSON body");
  }
}

export function badRequest(message = "Bad Request") {
  const err = new Error(message);
  // @ts-ignore
  err.status = 400;
  return err;
}

export function json(data: unknown, init?: number | ResponseInit) {
  if (typeof init === "number")
    return NextResponse.json(data, { status: init });
  return NextResponse.json(data, init);
}
