import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/microsoft/auth";

export async function GET() {
  const url = getAuthorizationUrl();
  return NextResponse.redirect(url);
}
