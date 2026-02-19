import { NextRequest, NextResponse } from "next/server";
import { tasks, activityEvents } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

// POST /tasks/:id/review-response — Human approves or rejects
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = tasks.find((t) => t.id === params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "REVIEW") {
    return NextResponse.json(
      {
        error: `Task must be in REVIEW status to respond. Current status: ${task.status}`,
      },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { decision, comment } = body;

  if (!decision || !["approve", "reject"].includes(decision)) {
    return NextResponse.json(
      { error: 'decision must be "approve" or "reject"' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  if (decision === "approve") {
    task.status = "APPROVED";
  } else {
    task.status = "REJECTED";
  }

  task.updatedAt = now;

  // Add review comment
  if (comment) {
    task.reviewComments.push({
      id: `rc-${uuidv4().slice(0, 8)}`,
      author: "Reviewer",
      authorType: "human",
      content: comment,
      timestamp: now,
    });
  }

  // Log activity
  activityEvents.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    type: "review_response",
    taskId: task.id,
    taskTitle: task.title,
    detail:
      decision === "approve"
        ? `Review approved: ${task.title}`
        : `Review rejected: ${comment || "No comment provided"}`,
    timestamp: now,
  });

  return NextResponse.json({
    task,
    message: `Task ${decision === "approve" ? "approved" : "rejected"}.`,
  });
}
