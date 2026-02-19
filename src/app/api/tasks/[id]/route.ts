import { NextRequest, NextResponse } from "next/server";
import { findTask, updateTask, deleteTask, addActivityEvent } from "@/lib/store";

// GET /tasks/:id — Get a single task
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = findTask(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

// PATCH /tasks/:id — Update task fields (title, description, tags, agentId)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = findTask(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ["title", "description", "tags", "agentId", "dependencies"];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: `No valid fields to update. Allowed: ${allowedFields.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = updateTask(params.id, updates);
  return NextResponse.json({ task: updated });
}

// DELETE /tasks/:id — Delete a task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = findTask(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  deleteTask(params.id);

  addActivityEvent({
    type: "status_change",
    taskId: task.id,
    taskTitle: task.title,
    detail: `Task deleted: ${task.title}`,
  });

  return NextResponse.json({ message: "Task deleted" });
}
