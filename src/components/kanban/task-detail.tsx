"use client";

import { Task, STATUS_COLORS, STATUS_LABELS, PROVIDER_COLORS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { getAgentById } from "@/lib/store";
import {
  X,
  Bot,
  Image,
  FileText,
  Link as LinkIcon,
  Terminal,
  Clock,
  MessageSquare,
} from "lucide-react";

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const evidenceIcons: Record<string, React.ElementType> = {
  SCREENSHOT: Image,
  LOG: Terminal,
  FILE: FileText,
  PR_LINK: LinkIcon,
  CUSTOM: FileText,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const agent = task.agentId ? getAgentById(task.agentId) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Badge className={cn(STATUS_COLORS[task.status])}>
              {STATUS_LABELS[task.status]}
            </Badge>
            <span className="text-xs text-gray-400 font-mono">{task.id}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          {/* Agent */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Assigned Agent
            </h3>
            {agent ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    PROVIDER_COLORS[agent.provider]
                  )}
                >
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {agent.type} &middot; {agent.provider}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No agent assigned</p>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-gray-300 text-gray-600"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Dependencies
              </h3>
              <div className="space-y-1">
                {task.dependencies.map((dep) => (
                  <p
                    key={dep}
                    className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1"
                  >
                    {dep}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {task.evidence.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Evidence ({task.evidence.length})
              </h3>
              <div className="space-y-2">
                {task.evidence.map((ev) => {
                  const Icon = evidenceIcons[ev.type] || FileText;
                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <Badge
                          variant="outline"
                          className="border-gray-200 text-gray-500 text-[10px]"
                        >
                          {ev.type}
                        </Badge>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          <Clock className="inline h-3 w-3 mr-0.5" />
                          {formatDate(ev.timestamp)}
                        </span>
                      </div>
                      {ev.context && (
                        <p className="text-xs text-gray-600 mt-1">
                          {ev.context}
                        </p>
                      )}
                      {ev.url && (
                        <p className="text-xs text-blue-600 mt-1 truncate">
                          {ev.url}
                        </p>
                      )}
                      {ev.content && (
                        <pre className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-700 overflow-x-auto">
                          {ev.content}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Comments */}
          {task.reviewComments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Review Comments ({task.reviewComments.length})
              </h3>
              <div className="space-y-3">
                {task.reviewComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "rounded-lg border p-3",
                      comment.authorType === "human"
                        ? "border-purple-200 bg-purple-50"
                        : "border-gray-200 bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 space-y-1">
            <p>Created: {formatDate(task.createdAt)}</p>
            <p>Updated: {formatDate(task.updatedAt)}</p>
            <p>
              Created by:{" "}
              {task.createdBy === "human" ? "Human operator" : task.createdBy}
            </p>
          </div>

          {/* Actions (for REVIEW status) */}
          {task.status === "REVIEW" && (
            <div className="border-t border-gray-200 pt-4 flex gap-3">
              <Button variant="default" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Approve
              </Button>
              <Button variant="destructive" className="flex-1">
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
