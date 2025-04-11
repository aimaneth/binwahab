"use client";

import { useState } from "react";
import { ShippingRate, ShippingZone } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ShippingRatesTableProps {
  rates: (ShippingRate & {
    zone: ShippingZone;
  })[];
  onEdit: (rate: ShippingRate) => void;
  onDelete: (rate: ShippingRate) => void;
}

export function ShippingRatesTable({
  rates,
  onEdit,
  onDelete,
}: ShippingRatesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRates = rates.filter((rate) =>
    rate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search rates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Weight Range</TableHead>
              <TableHead>Order Value Range</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>{rate.name}</TableCell>
                <TableCell>{rate.zone.name}</TableCell>
                <TableCell>
                  {rate.minWeight === null
                    ? "No limit"
                    : `${rate.minWeight}kg`}
                  {" - "}
                  {rate.maxWeight === null
                    ? "No limit"
                    : `${rate.maxWeight}kg`}
                </TableCell>
                <TableCell>
                  {rate.minOrderValue === null
                    ? "No limit"
                    : formatPrice(rate.minOrderValue)}
                  {" - "}
                  {rate.maxOrderValue === null
                    ? "No limit"
                    : formatPrice(rate.maxOrderValue)}
                </TableCell>
                <TableCell>{formatPrice(rate.price)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      rate.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {rate.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(rate)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(rate)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 