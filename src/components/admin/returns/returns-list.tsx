import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ReturnStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { ReturnWithRelations } from "@/lib/types/return";
import { ReturnActions } from "./return-actions";

export function ReturnsList() {
  const [status, setStatus] = useState<ReturnStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["returns", status, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(status && { status }),
        ...(search && { search }),
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/returns?${params}`);
      if (!response.ok) throw new Error("Failed to fetch returns");
      return response.json();
    },
  });

  const returns = data?.returns || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={status} onValueChange={(value) => setStatus(value as ReturnStatus | "")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by order ID or customer name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No returns found
                </TableCell>
              </TableRow>
            ) : (
              returns.map((return_: ReturnWithRelations) => (
                <TableRow key={return_.id}>
                  <TableCell>{return_.id}</TableCell>
                  <TableCell>{return_.orderId}</TableCell>
                  <TableCell>{return_.user.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      return_.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      return_.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      return_.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {return_.status}
                    </span>
                  </TableCell>
                  <TableCell>{return_.items.length} items</TableCell>
                  <TableCell>{formatDate(return_.createdAt)}</TableCell>
                  <TableCell>
                    <ReturnActions return_={return_} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
} 