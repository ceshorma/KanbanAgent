"use client";

import { Task, TaskStatus, STATUS_LABELS, STATUS_COLORS } from "@/types";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Plus } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

export function KanbanColumn({ status, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-xl bg-gray-50 border border-gray-200">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Badge className={cn(STATUS_COLORS[status], "text-xs")}>
            {STATUS_LABELS[status]}
          </Badge>
          <span className="text-xs font-medium text-gray-400">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            aria-label="Add new task"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Cards list */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 space-y-2 overflow-y-auto p-3 min-h-[120px] transition-colors",
              snapshot.isDraggingOver && "bg-purple-50/50"
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && (
              <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
                No tasks
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
