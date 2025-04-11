"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ShippingRate } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatPrice } from "@/lib/utils";

export const ratesColumns: ColumnDef<ShippingRate>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => formatPrice(row.getValue("price")),
  },
  {
    accessorKey: "minOrderValue",
    header: "Min Order",
    cell: ({ row }) => {
      const value = row.getValue("minOrderValue") as number | null;
      return value ? formatPrice(value) : "-";
    },
  },
  {
    accessorKey: "maxOrderValue",
    header: "Max Order",
    cell: ({ row }) => {
      const value = row.getValue("maxOrderValue") as number | null;
      return value ? formatPrice(value) : "-";
    },
  },
  {
    accessorKey: "minWeight",
    header: "Min Weight",
    cell: ({ row }) => {
      const value = row.getValue("minWeight") as number | null;
      return value ? `${value} kg` : "-";
    },
  },
  {
    accessorKey: "maxWeight",
    header: "Max Weight",
    cell: ({ row }) => {
      const value = row.getValue("maxWeight") as number | null;
      return value ? `${value} kg` : "-";
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rate = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 