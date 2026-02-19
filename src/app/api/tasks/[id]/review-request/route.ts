import { NextRequest, NextResponse } from "next/server";
import { tasks, agents, activityEvents } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

// POST /tasks/:id/review-request — Agent requests formal review
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = tasks.find((t) => t.id === params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "IN_PROGRESS" && task.status !== "REJECTED") {
    return NextResponse.json(
      {
        error: `Task must be IN_PROGRESS or REJECTED to request review. Current status: ${task.status}`,
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  task.status = "REVIEW";
  task.updatedAt = now;

  // Log activity
  const agent = task.agentId
    ? agents.find((a) => a.id === task.agentId)
    : null;

  activityEvents.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    type: "review_requested",
    taskId: task.id,
    taskTitle: task.title,
    agentId: task.agentId || undefined,
    agentName: agent?.name,
    detail: `Requested review for: ${task.title}`,
    timestamp: now,
  });

  return NextResponse.json({
    task,
    message: "Review requested. Reviewer will be notified.",
  });
}
