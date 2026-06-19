import { NextResponse } from "next/server";

export function secureJson(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function secureError(message: string, status = 400) {
  return secureJson({ error: message }, status);
}
