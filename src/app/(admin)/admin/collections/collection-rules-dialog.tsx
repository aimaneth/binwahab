"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CollectionRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionName: string;
  onSave: (rules: any[]) => Promise<void>;
}

export function CollectionRulesDialog({
  open,
  onOpenChange,
  collectionId,
  collectionName,
  onSave,
}: CollectionRulesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchRules();
    }
  }, [open, collectionId]);

  const fetchRules = async () => {
    try {
      const response = await fetch(`/api/admin/collections/rules?collectionId=${collectionId}`);
      if (!response.ok) throw new Error("Failed to fetch rules");
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Failed to load rules");
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(rules);
      onOpenChange(false);
      toast.success("Rules saved successfully");
    } catch (error) {
      console.error("Error saving rules:", error);
      toast.error("Failed to save rules");
    } finally {
      setIsLoading(false);
    }
  };

  const addRule = () => {
    setRules([
      ...rules,
      {
        field: "price",
        operator: "equals",
        value: "",
        order: rules.length,
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Collection Rules - {collectionName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-end space-x-2">
              <div>
                <Label>Field</Label>
                <Select
                  value={rule.field}
                  onValueChange={(value) => updateRule(index, "field", value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Operator</Label>
                <Select
                  value={rule.operator}
                  onValueChange={(value) => updateRule(index, "operator", value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Does not equal</SelectItem>
                    <SelectItem value="greater_than">Greater than</SelectItem>
                    <SelectItem value="less_than">Less than</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label>Value</Label>
                <Input
                  value={rule.value}
                  onChange={(e) => updateRule(index, "value", e.target.value)}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => removeRule(index)}
              >
                Remove
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addRule}
          >
            Add Rule
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 