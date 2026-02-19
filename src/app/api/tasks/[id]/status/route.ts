import { NextRequest, NextResponse } from "next/server";
import {
  findTask,
  updateTask,
  agents,
  addActivityEvent,
  isValidTransition,
} from "@/lib/store";
import { TaskStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

const VALID_STATUSES: TaskStatus[] = [
  "BACKLOG",
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "APPROVED",
  "REJECTED",
  "DONE",
];

// PATCH /tasks/:id/status — Change task status with transition validation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = findTask(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status, comment } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate status transition
  if (!isValidTransition(task.status, status)) {
    return NextResponse.json(
      {
        error: `Invalid transition: ${task.status} → ${status}. Allowed transitions from ${task.status}: ${VALID_STATUSES.filter((s) => isValidTransition(task.status, s)).join(", ") || "none"}`,
      },
      { status: 400 }
    );
  }

  const oldStatus = task.status;

  // Add comment if provided
  if (comment) {
    task.reviewComments.push({
      id: `rc-${uuidv4().slice(0, 8)}`,
      author: "System",
      authorType: "agent",
      content: comment,
      timestamp: new Date().toISOString(),
    });
  }

  const updated = updateTask(params.id, { status });

  // Log activity
  const agent = task.agentId
    ? agents.find((a) => a.id === task.agentId)
    : null;

  addActivityEvent({
    type: "status_change",
    taskId: task.id,
    taskTitle: task.title,
    agentId: task.agentId || undefined,
    agentName: agent?.name,
    detail: `Status changed: ${oldStatus} → ${status}`,
  });

  return NextResponse.json({ task: updated });
}
