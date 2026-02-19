import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function Home() {
  return (
    <>
      <Header
        title="Kanban Board"
        subtitle="Drag tasks between columns to update status"
      />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </>
  );
}
