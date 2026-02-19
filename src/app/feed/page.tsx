import { Header } from "@/components/layout/header";
import { AgentFeed } from "@/components/feed/agent-feed";

export default function FeedPage() {
  return (
    <>
      <Header
        title="Agent Feed"
        subtitle="Chronological log of all agent activity"
      />
      <div className="flex-1 overflow-y-auto">
        <AgentFeed />
      </div>
    </>
  );
}
