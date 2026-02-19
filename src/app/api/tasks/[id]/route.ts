import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@/lib/store";

// GET /tasks/:id — Get a single task
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = tasks.find((t) => t.id === params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
