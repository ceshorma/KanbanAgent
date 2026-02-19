import { NextResponse } from "next/server";
import { agents } from "@/lib/store";

// GET /api/agents — List all agents
export async function GET() {
  return NextResponse.json({ agents });
}
