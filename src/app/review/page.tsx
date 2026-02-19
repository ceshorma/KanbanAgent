import { Header } from "@/components/layout/header";
import { ReviewQueue } from "@/components/review/review-queue";

export default function ReviewPage() {
  return (
    <>
      <Header
        title="Review Queue"
        subtitle="Approve or reject tasks submitted by agents"
      />
      <div className="flex-1 overflow-y-auto">
        <ReviewQueue />
      </div>
    </>
  );
}
