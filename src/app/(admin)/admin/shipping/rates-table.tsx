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
import { Pencil, Trash2, Edit } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RatesTableProps {
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
}: RatesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRates = rates.filter((rate) =>
    rate.zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.price.toString().includes(searchQuery)
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
              <TableHead>Zone</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Weight Range</TableHead>
              <TableHead>Order Value Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>{rate.zone.name}</TableCell>
                <TableCell>{formatPrice(rate.price)}</TableCell>
                <TableCell>
                  {rate.minWeight === null
                    ? "No minimum"
                    : `${rate.minWeight} kg`}{" "}
                  -{" "}
                  {rate.maxWeight === null
                    ? "No maximum"
                    : `${rate.maxWeight} kg`}
                </TableCell>
                <TableCell>
                  {rate.minOrderValue === null
                    ? "No minimum"
                    : formatPrice(rate.minOrderValue)}{" "}
                  -{" "}
                  {rate.maxOrderValue === null
                    ? "No maximum"
                    : formatPrice(rate.maxOrderValue)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={rate.isActive ? "default" : "secondary"}
                  >
                    {rate.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(rate)}
                    >
                      <Edit className="h-4 w-4" />
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