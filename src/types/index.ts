export type TaskStatus =
  | "BACKLOG"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DONE";

export type EvidenceType = "SCREENSHOT" | "LOG" | "FILE" | "PR_LINK" | "CUSTOM";

export type AgentType = "PERSISTENT" | "EPHEMERAL";

export type AgentProvider = "CLAUDE" | "GPT" | "ANTIGRAVITY" | "CUSTOM";

export interface Evidence {
  id: string;
  type: EvidenceType;
  url?: string;
  content?: string;
  timestamp: string;
  context?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorType: "human" | "agent";
  content: string;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  provider: AgentProvider;
  activeTasks: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  agentId: string | null;
  createdBy: "human" | string;
  projectId: string;
  tags: string[];
  dependencies: string[];
  evidence: Evidence[];
  reviewComments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: "status_change" | "evidence_added" | "review_requested" | "review_response" | "task_created" | "comment_added";
  taskId: string;
  taskTitle: string;
  agentId?: string;
  agentName?: string;
  detail: string;
  timestamp: string;
}

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "BACKLOG",
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "APPROVED",
  "DONE",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DONE: "Done",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: "bg-gray-100 text-gray-700 border-gray-300",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-300",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-300",
  REVIEW: "bg-purple-50 text-purple-700 border-purple-400",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  REJECTED: "bg-red-50 text-red-700 border-red-300",
  DONE: "bg-green-50 text-green-700 border-green-300",
};

export const PROVIDER_COLORS: Record<AgentProvider, string> = {
  CLAUDE: "bg-orange-100 text-orange-800",
  GPT: "bg-teal-100 text-teal-800",
  ANTIGRAVITY: "bg-indigo-100 text-indigo-800",
  CUSTOM: "bg-gray-100 text-gray-800",
};
