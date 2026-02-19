import { NextResponse } from "next/server";
import { projects } from "@/lib/store";

// GET /api/projects — List all projects
export async function GET() {
  return NextResponse.json({ projects });
}
