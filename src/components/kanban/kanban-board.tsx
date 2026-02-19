"use client";

import { useState } from "react";
import { Task, TaskStatus, TASK_STATUS_ORDER } from "@/types";
import { tasks as initialTasks } from "@/lib/store";
import { KanbanColumn } from "./kanban-column";
import { TaskDetail } from "./task-detail";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";

// Columns to display (exclude REJECTED — those show in their agent's IN_PROGRESS or separately)
const VISIBLE_COLUMNS: TaskStatus[] = TASK_STATUS_ORDER;

export function KanbanBoard() {
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksByStatus = (status: TaskStatus): Task[] =>
    taskList.filter((t) => t.status === status);

  function handleDragEnd(result: DropResult) {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as TaskStatus;

    setTaskList((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );

    // Update selected task if it was dragged
    if (selectedTask?.id === draggableId) {
      setSelectedTask((prev) =>
        prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null
      );
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-6 pb-8">
          {VISIBLE_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
