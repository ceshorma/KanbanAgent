import { NextRequest, NextResponse } from "next/server";
import { tasks, agents, activityEvents } from "@/lib/store";
import { EvidenceType, Evidence } from "@/types";
import { v4 as uuidv4 } from "uuid";

const VALID_EVIDENCE_TYPES: EvidenceType[] = [
  "SCREENSHOT",
  "LOG",
  "FILE",
  "PR_LINK",
  "CUSTOM",
];

// POST /tasks/:id/evidence — Attach evidence to a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = tasks.find((t) => t.id === params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, url, content, context } = body;

  if (!type || !VALID_EVIDENCE_TYPES.includes(type)) {
    return NextResponse.json(
      {
        error: `Invalid evidence type. Must be one of: ${VALID_EVIDENCE_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!url && !content) {
    return NextResponse.json(
      { error: "Either url or content must be provided" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const evidence: Evidence = {
    id: `ev-${uuidv4().slice(0, 8)}`,
    type,
    url,
    content,
    timestamp: now,
    context,
  };

  task.evidence.push(evidence);
  task.updatedAt = now;

  // Log activity
  const agent = task.agentId
    ? agents.find((a) => a.id === task.agentId)
    : null;

  activityEvents.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    type: "evidence_added",
    taskId: task.id,
    taskTitle: task.title,
    agentId: task.agentId || undefined,
    agentName: agent?.name,
    detail: `Added ${type} evidence${context ? `: ${context}` : ""}`,
    timestamp: now,
  });

  return NextResponse.json({ evidence }, { status: 201 });
}
