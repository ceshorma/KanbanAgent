"use client";

import { ActivityEvent } from "@/types";
import { activityEvents } from "@/lib/store";
import { cn } from "@/lib/cn";
import {
  GitPullRequest,
  Image,
  MessageSquare,
  ArrowRightLeft,
  PlusCircle,
  CheckCircle2,
  Bot,
} from "lucide-react";

const eventConfig: Record<
  ActivityEvent["type"],
  { icon: React.ElementType; color: string }
> = {
  task_created: { icon: PlusCircle, color: "text-blue-500 bg-blue-50" },
  status_change: {
    icon: ArrowRightLeft,
    color: "text-amber-500 bg-amber-50",
  },
  evidence_added: { icon: Image, color: "text-teal-500 bg-teal-50" },
  review_requested: {
    icon: GitPullRequest,
    color: "text-purple-500 bg-purple-50",
  },
  review_response: {
    icon: CheckCircle2,
    color: "text-emerald-500 bg-emerald-50",
  },
  comment_added: {
    icon: MessageSquare,
    color: "text-gray-500 bg-gray-100",
  },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FeedItem({ event }: { event: ActivityEvent }) {
  const config = eventConfig[event.type];
  const Icon = config.icon;

  return (
    <div className="flex gap-3 py-3">
      {/* Icon */}
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          config.color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{event.detail}</p>
        <div className="flex items-center gap-3 mt-1">
          {event.agentName && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Bot className="h-3 w-3" />
              {event.agentName}
            </div>
          )}
          <span
            className="text-xs text-gray-400"
            title={formatAbsoluteTime(event.timestamp)}
          >
            {formatRelativeTime(event.timestamp)}
          </span>
          <span className="text-xs font-mono text-gray-300">
            {event.taskId}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AgentFeed() {
  // Sort by timestamp descending (most recent first)
  const sortedEvents = [...activityEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <p className="text-sm text-gray-500 mb-4">
        Real-time activity from all agents.
      </p>

      {sortedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bot className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">No activity yet</p>
          <p className="text-sm">
            Agent activity will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sortedEvents.map((event) => (
            <FeedItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
