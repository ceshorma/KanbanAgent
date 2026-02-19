import { Task, Agent, Project, ActivityEvent, TaskStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

// --- Valid status transitions ---
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  BACKLOG: ["ASSIGNED", "IN_PROGRESS"],
  ASSIGNED: ["IN_PROGRESS", "BACKLOG"],
  IN_PROGRESS: ["REVIEW", "BACKLOG"],
  REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["DONE"],
  REJECTED: ["IN_PROGRESS"],
  DONE: [],
};

export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// --- Seed Agents ---
export const agents: Agent[] = [
  {
    id: "agent-claude-backend",
    name: "Claude Code — Backend",
    type: "PERSISTENT",
    provider: "CLAUDE",
    activeTasks: 1,
  },
  {
    id: "agent-claude-infra",
    name: "Claude Code — Infra",
    type: "PERSISTENT",
    provider: "CLAUDE",
    activeTasks: 1,
  },
  {
    id: "agent-gpt-frontend",
    name: "GPT-4o — Frontend",
    type: "PERSISTENT",
    provider: "GPT",
    activeTasks: 1,
  },
  {
    id: "agent-antigravity-qa",
    name: "Antigravity — QA",
    type: "EPHEMERAL",
    provider: "ANTIGRAVITY",
    activeTasks: 0,
  },
  {
    id: "agent-custom-docs",
    name: "DocBot — Docs",
    type: "EPHEMERAL",
    provider: "CUSTOM",
    activeTasks: 1,
  },
];

// --- Seed Project ---
export const projects: Project[] = [
  {
    id: "proj-agentboard",
    name: "AgentBoard",
    description: "Kanban de orquestación para agentes IA",
  },
];

// --- Seed Tasks ---
export const tasks: Task[] = [
  {
    id: "task-001",
    title: "Set up PostgreSQL schema",
    description:
      "Create the initial database schema with tables for tasks, agents, projects, evidence, and comments. Use Supabase migrations.",
    status: "DONE",
    agentId: "agent-claude-infra",
    createdBy: "human",
    projectId: "proj-agentboard",
    tags: ["database", "infra"],
    dependencies: [],
    evidence: [
      {
        id: "ev-001",
        type: "PR_LINK",
        url: "https://github.com/example/agentboard/pull/1",
        timestamp: "2026-02-15T10:30:00Z",
        context: "Migration PR for initial schema",
      },
    ],
    reviewComments: [
      {
        id: "rc-001",
        author: "Operator",
        authorType: "human",
        content: "Schema looks good. Approved.",
        timestamp: "2026-02-15T14:00:00Z",
      },
    ],
    createdAt: "2026-02-14T09:00:00Z",
    updatedAt: "2026-02-15T14:00:00Z",
  },
  {
    id: "task-002",
    title: "Implement REST API for tasks CRUD",
    description:
      "Build the Next.js API routes for creating, reading, updating, and deleting tasks. Include filtering by status, project, and agent_id.",
    status: "REVIEW",
    agentId: "agent-claude-backend",
    createdBy: "human",
    projectId: "proj-agentboard",
    tags: ["api", "backend"],
    dependencies: ["task-001"],
    evidence: [
      {
        id: "ev-002",
        type: "LOG",
        content: "All 24 API tests passing. Coverage: 94%.",
        timestamp: "2026-02-17T16:45:00Z",
        context: "Test run output",
      },
      {
        id: "ev-003",
        type: "PR_LINK",
        url: "https://github.com/example/agentboard/pull/3",
        timestamp: "2026-02-17T16:50:00Z",
        context: "PR with all CRUD endpoints",
      },
    ],
    reviewComments: [],
    createdAt: "2026-02-15T15:00:00Z",
    updatedAt: "2026-02-17T16:50:00Z",
  },
  {
    id: "task-003",
    title: "Build Kanban board frontend",
    description:
      "Create the main Kanban view with drag-and-drop columns for each task status. Use @hello-pangea/dnd for DnD support.",
    status: "IN_PROGRESS",
    agentId: "agent-gpt-frontend",
    createdBy: "human",
    projectId: "proj-agentboard",
    tags: ["frontend", "ui"],
    dependencies: ["task-002"],
    evidence: [
      {
        id: "ev-004",
        type: "SCREENSHOT",
        url: "/screenshots/kanban-wip.png",
        timestamp: "2026-02-18T11:00:00Z",
        context: "Work-in-progress screenshot of the board layout",
      },
    ],
    reviewComments: [],
    createdAt: "2026-02-16T09:00:00Z",
    updatedAt: "2026-02-18T11:00:00Z",
  },
  {
    id: "task-004",
    title: "Migrate auth to Clerk",
    description:
      "Replace NextAuth.js with Clerk for human authentication. Configure OAuth providers (Google, GitHub). Preserve API key auth for agents.",
    status: "REVIEW",
    agentId: "agent-claude-infra",
    createdBy: "human",
    projectId: "proj-agentboard",
    tags: ["auth", "infra"],
    dependencies: [],
    evidence: [
      {
        id: "ev-005",
        type: "LOG",
        content:
          "Clerk integration complete. OAuth with Google and GitHub working. API key middleware unchanged.",
        timestamp: "2026-02-18T15:30:00Z",
        context: "Integration summary",
      },
    ],
    reviewComments: [],
    createdAt: "2026-02-17T08:00:00Z",
    updatedAt: "2026-02-18T15:30:00Z",
  },
  {
    id: "task-005",
    title: "Set up Cloudflare R2 for evidence storage",
    description:
      "Configure R2 bucket, set up presigned URL generation for uploads, and create the evidence upload API endpoint.",
    status: "ASSIGNED",
    agentId: "agent-claude-infra",
    createdBy: "agent-claude-backend",
    projectId: "proj-agentboard",
    tags: ["storage", "infra"],
    dependencies: ["task-001"],
    evidence: [],
    reviewComments: [],
    createdAt: "2026-02-18T09:00:00Z",
    updatedAt: "2026-02-18T09:00:00Z",
  },
  {
    id: "task-006",
    title: "Write API documentation",
    description:
      "Generate OpenAPI spec for all REST endpoints. Include examples for agent integration workflows.",
    status: "BACKLOG",
    agentId: null,
    createdBy: "human",
    projectId: "proj-agentboard",
    tags: ["docs"],
    dependencies: ["task-002"],
    evidence: [],
    reviewComments: [],
    createdAt: "2026-02-18T10:00:00Z",
    updatedAt: "2026-02-18T10:00:00Z",
  },
  {
    id: "task-007",
    title: "Implement Review Queue view",
    description:
      "Build the Review Queue page showing all tasks in REVIEW status, ordered by submission time. Include approve/reject controls with comment input.",
    status: "IN_PROGRESS",
    agentId: "agent-custom-docs",
    createdBy: "human",
    projectId: "proj-agentboard",
    tags: ["frontend", "ui"],
    dependencies: ["task-003"],
    evidence: [],
    reviewComments: [],
    createdAt: "2026-02-18T14:00:00Z",
    updatedAt: "2026-02-18T14:00:00Z",
  },
  {
    id: "task-008",
    title: "Add notification integration with Claw",
    description:
      "Set up Claw API for push notifications when an agent requests review. Include deep links to the task in the board.",
    status: "BACKLOG",
    agentId: null,
    createdBy: "human",
    projectId: "proj-agentboard",
    tags: ["notifications", "integration"],
    dependencies: ["task-002"],
    evidence: [],
    reviewComments: [],
    createdAt: "2026-02-18T16:00:00Z",
    updatedAt: "2026-02-18T16:00:00Z",
  },
  {
    id: "task-009",
    title: "E2E testing for review workflow",
    description:
      "Write end-to-end tests covering the full review flow: agent submits for review, human approves/rejects, agent picks up rejection comments.",
    status: "BACKLOG",
    agentId: null,
    createdBy: "agent-claude-backend",
    projectId: "proj-agentboard",
    tags: ["testing", "qa"],
    dependencies: ["task-002", "task-003"],
    evidence: [],
    reviewComments: [],
    createdAt: "2026-02-19T08:00:00Z",
    updatedAt: "2026-02-19T08:00:00Z",
  },
  {
    id: "task-010",
    title: "Fix review comment rendering bug",
    description:
      "Review comments with markdown formatting are not rendered correctly in the task detail panel. Need to add a markdown renderer.",
    status: "REJECTED",
    agentId: "agent-gpt-frontend",
    createdBy: "agent-antigravity-qa",
    projectId: "proj-agentboard",
    tags: ["bug", "frontend"],
    dependencies: [],
    evidence: [
      {
        id: "ev-006",
        type: "SCREENSHOT",
        url: "/screenshots/markdown-bug.png",
        timestamp: "2026-02-19T09:00:00Z",
        context: "Screenshot showing broken markdown in review comments",
      },
    ],
    reviewComments: [
      {
        id: "rc-002",
        author: "Operator",
        authorType: "human",
        content:
          "The fix only handles bold/italic but not code blocks. Please also handle fenced code blocks and inline code.",
        timestamp: "2026-02-19T11:00:00Z",
      },
    ],
    createdAt: "2026-02-19T08:30:00Z",
    updatedAt: "2026-02-19T11:00:00Z",
  },
];

// --- Seed Activity ---
export const activityEvents: ActivityEvent[] = [
  {
    id: "evt-001",
    type: "task_created",
    taskId: "task-009",
    taskTitle: "E2E testing for review workflow",
    agentId: "agent-claude-backend",
    agentName: "Claude Code — Backend",
    detail: "Created new task: E2E testing for review workflow",
    timestamp: "2026-02-19T08:00:00Z",
  },
  {
    id: "evt-002",
    type: "task_created",
    taskId: "task-010",
    taskTitle: "Fix review comment rendering bug",
    agentId: "agent-antigravity-qa",
    agentName: "Antigravity — QA",
    detail: "Filed bug: Fix review comment rendering bug",
    timestamp: "2026-02-19T08:30:00Z",
  },
  {
    id: "evt-003",
    type: "evidence_added",
    taskId: "task-010",
    taskTitle: "Fix review comment rendering bug",
    agentId: "agent-antigravity-qa",
    agentName: "Antigravity — QA",
    detail: "Added screenshot evidence: broken markdown in review comments",
    timestamp: "2026-02-19T09:00:00Z",
  },
  {
    id: "evt-004",
    type: "status_change",
    taskId: "task-010",
    taskTitle: "Fix review comment rendering bug",
    agentId: "agent-gpt-frontend",
    agentName: "GPT-4o — Frontend",
    detail: "Status changed: ASSIGNED → IN_PROGRESS",
    timestamp: "2026-02-19T09:15:00Z",
  },
  {
    id: "evt-005",
    type: "review_requested",
    taskId: "task-010",
    taskTitle: "Fix review comment rendering bug",
    agentId: "agent-gpt-frontend",
    agentName: "GPT-4o — Frontend",
    detail: "Requested review for: Fix review comment rendering bug",
    timestamp: "2026-02-19T10:30:00Z",
  },
  {
    id: "evt-006",
    type: "review_response",
    taskId: "task-010",
    taskTitle: "Fix review comment rendering bug",
    detail:
      "Review rejected: fix only handles bold/italic but not code blocks",
    timestamp: "2026-02-19T11:00:00Z",
  },
  {
    id: "evt-007",
    type: "review_requested",
    taskId: "task-002",
    taskTitle: "Implement REST API for tasks CRUD",
    agentId: "agent-claude-backend",
    agentName: "Claude Code — Backend",
    detail: "Requested review for: Implement REST API for tasks CRUD",
    timestamp: "2026-02-17T16:50:00Z",
  },
  {
    id: "evt-008",
    type: "review_requested",
    taskId: "task-004",
    taskTitle: "Migrate auth to Clerk",
    agentId: "agent-claude-infra",
    agentName: "Claude Code — Infra",
    detail: "Requested review for: Migrate auth to Clerk",
    timestamp: "2026-02-18T15:30:00Z",
  },
  {
    id: "evt-009",
    type: "evidence_added",
    taskId: "task-003",
    taskTitle: "Build Kanban board frontend",
    agentId: "agent-gpt-frontend",
    agentName: "GPT-4o — Frontend",
    detail: "Added WIP screenshot of the board layout",
    timestamp: "2026-02-18T11:00:00Z",
  },
  {
    id: "evt-010",
    type: "status_change",
    taskId: "task-005",
    taskTitle: "Set up Cloudflare R2 for evidence storage",
    agentId: "agent-claude-infra",
    agentName: "Claude Code — Infra",
    detail: "Status changed: BACKLOG → ASSIGNED",
    timestamp: "2026-02-18T09:00:00Z",
  },
];

// --- Store mutation helpers ---

export function findTask(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
  return tasks[idx];
}

export function deleteTask(id: string): boolean {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}

export function addActivityEvent(
  event: Omit<ActivityEvent, "id" | "timestamp">
): ActivityEvent {
  const full: ActivityEvent = {
    ...event,
    id: `evt-${uuidv4().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
  };
  activityEvents.push(full);
  return full;
}

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function getTasksByStatus(status: Task["status"]): Task[] {
  return tasks.filter((t) => t.status === status);
}

export function getReviewTasks(): Task[] {
  return tasks
    .filter((t) => t.status === "REVIEW")
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
}
