"use client";

import { useState } from "react";
import { Task, PROVIDER_COLORS } from "@/types";
import { getReviewTasks, getAgentById } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  Bot,
  Clock,
  Image,
  FileText,
  Terminal,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const evidenceIcons: Record<string, React.ElementType> = {
  SCREENSHOT: Image,
  LOG: Terminal,
  FILE: FileText,
  PR_LINK: LinkIcon,
  CUSTOM: FileText,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ReviewCard({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const agent = task.agentId ? getAgentById(task.agentId) : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {task.title}
            </h3>
            <span className="text-xs font-mono text-gray-400">{task.id}</span>
          </div>
          <div className="flex items-center gap-3">
            {agent && (
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    PROVIDER_COLORS[agent.provider]
                  )}
                >
                  <Bot className="h-3 w-3" />
                </div>
                <span className="text-xs text-gray-500">{agent.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {timeAgo(task.updatedAt)}
            </div>
            {task.evidence.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-500">
                {task.evidence.length} evidence
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button size="sm" variant="destructive" className="gap-1">
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">
              Description
            </h4>
            <p className="text-sm text-gray-700">{task.description}</p>
          </div>

          {/* Evidence */}
          {task.evidence.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                Evidence
              </h4>
              <div className="space-y-2">
                {task.evidence.map((ev) => {
                  const Icon = evidenceIcons[ev.type] || FileText;
                  return (
                    <div
                      key={ev.id}
                      className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <Icon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-gray-200 text-gray-500"
                          >
                            {ev.type}
                          </Badge>
                          <span className="text-[10px] text-gray-400">
                            {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {ev.context && (
                          <p className="text-xs text-gray-600">{ev.context}</p>
                        )}
                        {ev.url && (
                          <p className="text-xs text-blue-600 truncate">
                            {ev.url}
                          </p>
                        )}
                        {ev.content && (
                          <pre className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-700 overflow-x-auto">
                            {ev.content}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment textarea */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">
              Review Comment (optional)
            </h4>
            <textarea
              rows={2}
              placeholder="Add a comment for the agent..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewQueue() {
  const reviewTasks = getReviewTasks();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {reviewTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckCircle2 className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm">No tasks pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            {reviewTasks.length} task{reviewTasks.length !== 1 ? "s" : ""}{" "}
            pending review, ordered by submission time.
          </p>
          {reviewTasks.map((task) => (
            <ReviewCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
