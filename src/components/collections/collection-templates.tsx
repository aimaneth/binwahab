"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collection } from "@prisma/client";

interface CollectionTemplate {
  id: string;
  name: string;
  description: string;
  type: "MANUAL" | "AUTOMATED";
  conditions?: any;
  icon: string;
}

const templates: CollectionTemplate[] = [
  {
    id: "new-arrivals",
    name: "New Arrivals",
    description: "Showcase your newest products to customers",
    type: "AUTOMATED",
    conditions: {
      operator: "AND",
      rules: [
        { field: "createdAt", operator: "greater_than", value: "30d" }
      ]
    },
    icon: "🆕"
  },
  {
    id: "best-sellers",
    name: "Best Sellers",
    description: "Highlight your most popular products",
    type: "AUTOMATED",
    conditions: {
      operator: "AND",
      rules: [
        { field: "sales", operator: "greater_than", value: 10 }
      ]
    },
    icon: "⭐"
  },
  {
    id: "sale-items",
    name: "Sale Items",
    description: "Feature products with special discounts",
    type: "AUTOMATED",
    conditions: {
      operator: "AND",
      rules: [
        { field: "discount", operator: "greater_than", value: 0 }
      ]
    },
    icon: "🏷️"
  },
  {
    id: "low-stock",
    name: "Low Stock",
    description: "Products that are running low on inventory",
    type: "AUTOMATED",
    conditions: {
      operator: "AND",
      rules: [
        { field: "stock", operator: "less_than", value: 10 },
        { field: "stock", operator: "greater_than", value: 0 }
      ]
    },
    icon: "📉"
  },
  {
    id: "featured",
    name: "Featured Collection",
    description: "Manually curated collection of featured products",
    type: "MANUAL",
    icon: "🌟"
  },
  {
    id: "seasonal",
    name: "Seasonal Collection",
    description: "Products for the current season",
    type: "AUTOMATED",
    conditions: {
      operator: "AND",
      rules: [
        { field: "season", operator: "equals", value: "current" }
      ]
    },
    icon: "🌤️"
  }
];

interface CollectionTemplatesProps {
  onSelectTemplate: (template: CollectionTemplate) => void;
}

export function CollectionTemplates({ onSelectTemplate }: CollectionTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{template.icon}</span>
              <CardTitle>{template.name}</CardTitle>
            </div>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Type: <span className="font-medium">{template.type === "MANUAL" ? "Manual" : "Automated"}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onSelectTemplate(template)}
            >
              Use Template
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 