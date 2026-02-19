"use client";

import { useState, useEffect, useRef } from "react";
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
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onTaskUpdate?: (task: Task) => void;
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

export function TaskDetail({ task, onClose, onTaskUpdate }: TaskDetailProps) {
  const agent = task.agentId ? getAgentById(task.agentId) : null;
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  async function handleReviewDecision(decision: "approve" | "reject") {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/review-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          comment: reviewComment || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
        return;
      }

      const data = await res.json();
      onTaskUpdate?.(data.task);
      setReviewComment("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Task details: ${task.title}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

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
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close task detail panel"
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
            <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
          </div>

          {/* Agent */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned Agent</h3>
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
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
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
                  <Badge key={tag} variant="outline" className="border-gray-300 text-gray-600">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Dependencies</h3>
              <div className="space-y-1">
                {task.dependencies.map((dep) => (
                  <p key={dep} className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1">
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
                    <div key={ev.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <Badge variant="outline" className="border-gray-200 text-gray-500 text-[10px]">
                          {ev.type}
                        </Badge>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          <Clock className="inline h-3 w-3 mr-0.5" />
                          {formatDate(ev.timestamp)}
                        </span>
                      </div>
                      {ev.context && <p className="text-xs text-gray-600 mt-1">{ev.context}</p>}
                      {ev.url && <p className="text-xs text-blue-600 mt-1 truncate">{ev.url}</p>}
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
                      <span className="text-xs font-medium text-gray-700">{comment.author}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(comment.timestamp)}</span>
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

          {/* Review actions */}
          {task.status === "REVIEW" && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a review comment (optional)..."
                aria-label="Review comment"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
              />

              {error && (
                <p className="text-sm text-red-600" role="alert">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                  onClick={() => handleReviewDecision("approve")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-1.5"
                  onClick={() => handleReviewDecision("reject")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Status after review action */}
          {(task.status === "APPROVED" || task.status === "REJECTED") && (
            <div
              className={cn(
                "border-t pt-4 text-sm font-medium",
                task.status === "APPROVED" ? "text-emerald-600" : "text-red-600"
              )}
            >
              {task.status === "APPROVED" ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Approved
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" /> Rejected — awaiting revision
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
