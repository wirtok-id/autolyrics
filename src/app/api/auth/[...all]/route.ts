import { auth } from "@/lib/auth";

// Better Auth handler for all auth routes
export async function GET(request: Request) {
  return auth.handler(request);
}

export async function POST(request: Request) {
  return auth.handler(request);
}
