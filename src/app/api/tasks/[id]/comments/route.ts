import { NextRequest, NextResponse } from "next/server";
import { findTask, addActivityEvent, agents } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

// POST /tasks/:id/comments — Add a comment to a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = findTask(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content, author, authorType } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "content is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  const comment = {
    id: `rc-${uuidv4().slice(0, 8)}`,
    author: author || "Anonymous",
    authorType: (authorType === "agent" ? "agent" : "human") as "human" | "agent",
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };

  task.reviewComments.push(comment);
  task.updatedAt = new Date().toISOString();

  const agent = task.agentId
    ? agents.find((a) => a.id === task.agentId)
    : null;

  addActivityEvent({
    type: "comment_added",
    taskId: task.id,
    taskTitle: task.title,
    agentId: authorType === "agent" ? author : undefined,
    agentName: agent?.name,
    detail: `Comment added on: ${task.title}`,
  });

  return NextResponse.json({ comment }, { status: 201 });
}
