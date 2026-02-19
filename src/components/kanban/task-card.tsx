"use client";

import { Task, PROVIDER_COLORS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { getAgentById } from "@/lib/store";
import {
  Bot,
  Image,
  FileText,
  Link as LinkIcon,
  Terminal,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick?: (task: Task) => void;
}

const evidenceIcons: Record<string, React.ElementType> = {
  SCREENSHOT: Image,
  LOG: Terminal,
  FILE: FileText,
  PR_LINK: LinkIcon,
  CUSTOM: FileText,
};

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const agent = task.agentId ? getAgentById(task.agentId) : null;
  const isReview = task.status === "REVIEW";
  const isRejected = task.status === "REJECTED";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(task)}
          className={cn(
            "group cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md",
            snapshot.isDragging && "shadow-lg ring-2 ring-purple-300",
            isReview && "border-purple-400 ring-1 ring-purple-200",
            isRejected && "border-red-300 ring-1 ring-red-100",
            !isReview && !isRejected && "border-gray-200"
          )}
        >
          {/* Review indicator */}
          {isReview && (
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-purple-600">
              <AlertCircle className="h-3 w-3" />
              Awaiting Review
            </div>
          )}

          {/* Rejected indicator */}
          {isRejected && (
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertCircle className="h-3 w-3" />
              Rejected — needs revision
            </div>
          )}

          {/* Title */}
          <h3 className="text-sm font-medium text-gray-900 leading-snug">
            {task.title}
          </h3>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-gray-200 text-gray-500 text-[10px]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Bottom row: agent + evidence */}
          <div className="mt-3 flex items-center justify-between">
            {/* Agent */}
            {agent ? (
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    PROVIDER_COLORS[agent.provider]
                  )}
                >
                  <Bot className="h-3 w-3" />
                </div>
                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                  {agent.name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Unassigned</span>
            )}

            {/* Evidence & comments indicators */}
            <div className="flex items-center gap-2">
              {task.evidence.length > 0 && (
                <div className="flex items-center gap-0.5 text-gray-400">
                  {(() => {
                    const Icon =
                      evidenceIcons[task.evidence[0].type] || FileText;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  <span className="text-[10px]">{task.evidence.length}</span>
                </div>
              )}
              {task.reviewComments.length > 0 && (
                <div className="flex items-center gap-0.5 text-gray-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px]">
                    {task.reviewComments.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
