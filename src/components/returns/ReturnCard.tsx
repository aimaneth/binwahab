import { Return, ReturnItem, Refund } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ReturnStatusBadge } from "./ReturnStatusBadge";
import { formatDate } from "@/lib/utils";

interface ReturnCardProps {
  returnData: Return & {
    items: ReturnItem[];
    refund?: Refund | null;
  };
}

export function ReturnCard({ returnData }: ReturnCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Return #{returnData.id}
        </CardTitle>
        <ReturnStatusBadge status={returnData.status} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID:</span>
            <span>{returnData.orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(returnData.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items:</span>
            <span>{returnData.items.length}</span>
          </div>
          {returnData.refund && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Refund Amount:</span>
              <span>${returnData.refund.amount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Last updated: {formatDate(returnData.updatedAt)}
        </div>
      </CardFooter>
    </Card>
  );
} 