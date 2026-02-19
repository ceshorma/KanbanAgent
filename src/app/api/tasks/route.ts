import { NextRequest, NextResponse } from "next/server";
import { tasks, agents, activityEvents } from "@/lib/store";
import { Task, TaskStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

// GET /tasks — List tasks filtered by status, project, agent_id
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as TaskStatus | null;
  const projectId = searchParams.get("project");
  const agentId = searchParams.get("agent_id");

  let filtered = [...tasks];

  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (projectId) {
    filtered = filtered.filter((t) => t.projectId === projectId);
  }
  if (agentId) {
    filtered = filtered.filter((t) => t.agentId === agentId);
  }

  return NextResponse.json({ tasks: filtered });
}

// POST /tasks — Create a new task
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { title, description, projectId, tags, dependencies, createdBy, agentId } = body;

  if (!title || !description || !projectId) {
    return NextResponse.json(
      { error: "title, description, and projectId are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const newTask: Task = {
    id: `task-${uuidv4().slice(0, 8)}`,
    title,
    description,
    status: agentId ? "ASSIGNED" : "BACKLOG",
    agentId: agentId || null,
    createdBy: createdBy || "human",
    projectId,
    tags: tags || [],
    dependencies: dependencies || [],
    evidence: [],
    reviewComments: [],
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(newTask);

  // Log activity event
  const agent = agentId ? agents.find((a) => a.id === agentId) : null;
  activityEvents.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    type: "task_created",
    taskId: newTask.id,
    taskTitle: newTask.title,
    agentId: createdBy !== "human" ? createdBy : undefined,
    agentName: agent?.name,
    detail: `Created new task: ${newTask.title}`,
    timestamp: now,
  });

  return NextResponse.json({ task: newTask }, { status: 201 });
}
