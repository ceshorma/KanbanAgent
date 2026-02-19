"use client";

import { useState, useCallback } from "react";
import { Task, TaskStatus, TASK_STATUS_ORDER } from "@/types";
import { tasks as initialTasks } from "@/lib/store";
import { KanbanColumn } from "./kanban-column";
import { TaskDetail } from "./task-detail";
import { CreateTaskModal } from "./create-task-modal";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";

const VISIBLE_COLUMNS: TaskStatus[] = TASK_STATUS_ORDER;

export function KanbanBoard() {
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tasksByStatus = (status: TaskStatus): Task[] =>
    taskList.filter((t) => t.status === status);

  async function handleDragEnd(result: DropResult) {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as TaskStatus;
    const task = taskList.find((t) => t.id === draggableId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTaskList((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );

    // Persist via API
    try {
      const res = await fetch(`/api/tasks/${draggableId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === draggableId
              ? { ...t, status: task.status, updatedAt: task.updatedAt }
              : t
          )
        );
      } else {
        const data = await res.json();
        setTaskList((prev) =>
          prev.map((t) => (t.id === draggableId ? data.task : t))
        );
      }
    } catch {
      // Revert on network error
      setTaskList((prev) =>
        prev.map((t) =>
          t.id === draggableId
            ? { ...t, status: task.status, updatedAt: task.updatedAt }
            : t
        )
      );
    }
  }

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
  }, []);

  const handleTaskCreated = useCallback((newTask: Task) => {
    setTaskList((prev) => [...prev, newTask]);
    setShowCreateModal(false);
  }, []);

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
              onAddTask={status === "BACKLOG" ? () => setShowCreateModal(true) : undefined}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </>
  );
}
