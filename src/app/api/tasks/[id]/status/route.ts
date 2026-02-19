import { NextRequest, NextResponse } from "next/server";
import { tasks, agents, activityEvents } from "@/lib/store";
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

// PATCH /tasks/:id/status — Change task status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = tasks.find((t) => t.id === params.id);

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

  const oldStatus = task.status;
  const now = new Date().toISOString();

  task.status = status;
  task.updatedAt = now;

  // Add comment if provided
  if (comment) {
    task.reviewComments.push({
      id: `rc-${uuidv4().slice(0, 8)}`,
      author: "System",
      authorType: "agent",
      content: comment,
      timestamp: now,
    });
  }

  // Log activity
  const agent = task.agentId
    ? agents.find((a) => a.id === task.agentId)
    : null;

  activityEvents.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    type: "status_change",
    taskId: task.id,
    taskTitle: task.title,
    agentId: task.agentId || undefined,
    agentName: agent?.name,
    detail: `Status changed: ${oldStatus} → ${status}`,
    timestamp: now,
  });

  return NextResponse.json({ task });
}
