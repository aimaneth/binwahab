import { Metadata } from "next";
import { ReturnsList } from "@/components/admin/returns/returns-list";

export const metadata: Metadata = {
  title: "Returns Management",
  description: "Manage customer returns and refunds",
};

export default function ReturnsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Returns</h2>
      </div>
      <ReturnsList />
    </div>
  );
} 