import packageJson from "@/package.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "oaktech-software-store",
    version: packageJson.version,
  });
}
