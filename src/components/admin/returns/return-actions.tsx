import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ReturnStatus, RefundMethod, ReturnWithRelations } from "@/lib/types/return";
import { Loader2 } from "lucide-react";

interface ReturnActionsProps {
  return_: ReturnWithRelations;
}

export function ReturnActions({ return_: return_ }: ReturnActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ReturnStatus>(return_.status);
  const [refundAmount, setRefundAmount] = useState<string>(
    return_.refund?.amount.toString() || ""
  );
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(() => {
    const method = return_.refund?.method;
    if (method === "CREDIT_CARD" || method === "PAYPAL" || method === "STORE_CREDIT") {
      return method;
    }
    return "CREDIT_CARD";
  });
  const [notes, setNotes] = useState(return_.notes || "");

  const queryClient = useQueryClient();

  const { mutate: updateReturn, isPending } = useMutation({
    mutationFn: async (data: {
      status: ReturnStatus;
      refundAmount?: number;
      refundMethod?: RefundMethod;
      notes?: string;
    }) => {
      const response = await fetch(`/api/returns/${return_.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update return");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      toast.success("Return updated successfully");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateReturn({
      status,
      refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
      refundMethod,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Return</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Return</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value: ReturnStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "APPROVED" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Refund Amount</label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Refund Method</label>
                <Select
                  value={refundMethod}
                  onValueChange={(value: RefundMethod) => setRefundMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select refund method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                    <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about the return"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Return
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 