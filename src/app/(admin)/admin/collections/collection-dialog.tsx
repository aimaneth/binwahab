"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { Collection } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionPreview } from "@/components/collections/collection-preview";
import { CollectionTemplates } from "@/components/collections/collection-templates";
import { Checkbox } from "@/components/ui/checkbox";

type CollectionType = "MANUAL" | "AUTOMATED";

interface ConditionRule {
  field: string;
  operator: string;
  value: number;
}

interface Conditions {
  operator: "AND" | "OR";
  rules: ConditionRule[];
}

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection;
  onSave: (data: Partial<Collection>) => void;
}

export function CollectionDialog({
  open,
  onOpenChange,
  collection,
  onSave,
}: CollectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(collection?.name ?? "");
  const [handle, setHandle] = useState(collection?.handle ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [image, setImage] = useState(collection?.image ?? "");
  const [image2, setImage2] = useState(collection?.image2 ?? "");
  const [type, setType] = useState<CollectionType>(collection?.type as CollectionType ?? "MANUAL");
  const [conditions, setConditions] = useState<Conditions>({
    operator: "AND",
    rules: [
      { field: "price", operator: "greater_than", value: 0 }
    ]
  });
  const [isActive, setIsActive] = useState(collection?.isActive ?? true);
  const [order, setOrder] = useState(collection?.order ?? 0);
  const [seoTitle, setSeoTitle] = useState(collection?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(collection?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(collection?.seoKeywords ?? "");
  const [activeTab, setActiveTab] = useState(collection ? "details" : "templates");
  const [showOnHomePage, setShowOnHomePage] = useState(collection?.showOnHomePage ?? false);
  const [displaySection, setDisplaySection] = useState<"FEATURED" | "COMPLETE" | "NONE">(collection?.displaySection ?? "NONE");

  useEffect(() => {
    if (collection) {
      // Update state with collection data
      setName(collection.name || "");
      setHandle(collection.handle || "");
      setDescription(collection.description || "");
      setImage(collection.image || "");
      setImage2(collection.image2 || "");
      setType(collection.type as CollectionType || "MANUAL");
      if (collection.conditions) {
        try {
          const parsedConditions = JSON.parse(JSON.stringify(collection.conditions)) as Conditions;
          if (parsedConditions.operator && Array.isArray(parsedConditions.rules)) {
            setConditions(parsedConditions);
          }
        } catch (error) {
          console.error("Error parsing conditions:", error);
        }
      }
      setIsActive(collection.isActive ?? true);
      setOrder(collection.order || 0);
      setSeoTitle(collection.seoTitle || "");
      setSeoDescription(collection.seoDescription || "");
      setSeoKeywords(collection.seoKeywords || "");
      setShowOnHomePage(collection.showOnHomePage ?? false);
      setDisplaySection(collection.displaySection ?? "NONE");
      setActiveTab("details");
    } else {
      // Reset state for new collection
      setName("");
      setHandle("");
      setDescription("");
      setImage("");
      setImage2("");
      setType("MANUAL");
      setConditions({
        operator: "AND",
        rules: [
          { field: "price", operator: "greater_than", value: 0 }
        ]
      });
      setIsActive(true);
      setOrder(0);
      setSeoTitle("");
      setSeoDescription("");
      setSeoKeywords("");
      setShowOnHomePage(false);
      setDisplaySection("NONE");
      setActiveTab("templates");
    }
  }, [collection, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name,
        handle: handle || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        image,
        image2,
        type,
        conditions: JSON.parse(JSON.stringify(conditions)),
        isActive,
        order,
        seoTitle,
        seoDescription,
        seoKeywords,
        showOnHomePage,
        displaySection
      };

      console.log("Submitting collection data:", data);
      
      onSave(data);
      toast.success(collection ? "Collection updated successfully" : "Collection created successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to save collection");
    } finally {
      setIsLoading(false);
    }
  };

  const addConditionRule = () => {
    setConditions({
      ...conditions,
      rules: [
        ...conditions.rules,
        { field: "price", operator: "greater_than", value: 0 }
      ]
    });
  };

  const removeConditionRule = (index: number) => {
    setConditions({
      ...conditions,
      rules: conditions.rules.filter((_, i) => i !== index)
    });
  };

  const updateConditionRule = (index: number, field: keyof ConditionRule, value: any) => {
    const newRules = [...conditions.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setConditions({
      ...conditions,
      rules: newRules
    });
  };

  const handleTemplateSelect = (template: any) => {
    setName(template.name);
    setType(template.type);
    if (template.conditions) {
      setConditions(template.conditions);
    }
    setActiveTab("details");
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // If we're trying to close the dialog and there's an active file input,
        // don't close it
        if (!newOpen) {
          // Check if there's a file input dialog open
          const fileInputs = document.querySelectorAll('input[type="file"]');
          for (const input of fileInputs) {
            if (document.activeElement === input || input.contains(document.activeElement)) {
              return;
            }
          }
          
          // Check if we're in the middle of a file selection
          if (document.activeElement instanceof HTMLInputElement && 
              document.activeElement.type === 'file') {
            return;
          }
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {collection ? "Edit Collection" : "New Collection"}
          </DialogTitle>
          <DialogDescription>
            {collection ? "Edit the collection details below." : "Choose a template or create a collection from scratch."}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="px-6">
            {!collection && <TabsTrigger value="templates">Templates</TabsTrigger>}
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="preview" disabled={!collection && type === "MANUAL"}>
              Preview
            </TabsTrigger>
          </TabsList>
          
          {!collection && (
            <TabsContent value="templates" className="flex-1 overflow-y-auto px-6 py-4">
              <CollectionTemplates onSelectTemplate={handleTemplateSelect} />
            </TabsContent>
          )}
          
          <TabsContent value="details" className="flex-1 overflow-y-auto min-h-0">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="handle">Handle</Label>
                      <Input
                        id="handle"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image">Primary Image</Label>
                      <ImageUpload
                        value={image}
                        onChange={setImage}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image2">Secondary Image (for collage)</Label>
                      <ImageUpload
                        value={image2}
                        onChange={(value) => {
                          console.log("Secondary image changed to:", value);
                          setImage2(value);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Collection Type</Label>
                    <Select
                      value={type}
                      onValueChange={(value: "MANUAL" | "AUTOMATED") => setType(value as CollectionType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="AUTOMATED">Automated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {type === "AUTOMATED" && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Label>Match</Label>
                            <Select
                              value={conditions.operator}
                              onValueChange={(value: "AND" | "OR") =>
                                setConditions({
                                  ...conditions,
                                  operator: value
                                })
                              }
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">All</SelectItem>
                                <SelectItem value="OR">Any</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-4">
                            {conditions.rules.map((rule, index) => (
                              <div key={index} className="flex items-end space-x-2">
                                <div>
                                  <Label>Field</Label>
                                  <Select
                                    value={rule.field}
                                    onValueChange={(value) =>
                                      updateConditionRule(index, "field", value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="price">Price</SelectItem>
                                      <SelectItem value="category">Category</SelectItem>
                                      <SelectItem value="tag">Tag</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>Operator</Label>
                                  <Select
                                    value={rule.operator}
                                    onValueChange={(value) =>
                                      updateConditionRule(index, "operator", value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="equals">Equals</SelectItem>
                                      <SelectItem value="not_equals">Not Equals</SelectItem>
                                      <SelectItem value="greater_than">Greater Than</SelectItem>
                                      <SelectItem value="less_than">Less Than</SelectItem>
                                      <SelectItem value="contains">Contains</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>Value</Label>
                                  <Input
                                    type="number"
                                    value={rule.value || ""}
                                    onChange={(e) => {
                                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                      if (!isNaN(value)) {
                                        updateConditionRule(index, "value", value);
                                      }
                                    }}
                                  />
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeConditionRule(index)}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addConditionRule}
                            >
                              Add Condition
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="order">Display Order</Label>
                      <Input
                        id="order"
                        type="number"
                        value={order}
                        onChange={(e) => setOrder(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">SEO Settings</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="seoTitle">SEO Title</Label>
                      <Input
                        id="seoTitle"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seoDescription">SEO Description</Label>
                      <Textarea
                        id="seoDescription"
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seoKeywords">SEO Keywords</Label>
                      <Input
                        id="seoKeywords"
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder="Enter keywords separated by commas"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showOnHomePage"
                        checked={showOnHomePage}
                        onCheckedChange={(checked) =>
                          setShowOnHomePage(checked as boolean)
                        }
                      />
                      <Label htmlFor="showOnHomePage">Show on Home Page</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displaySection">Display Section</Label>
                      <Select
                        value={displaySection}
                        onValueChange={(value: "FEATURED" | "COMPLETE" | "NONE") =>
                          setDisplaySection(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select display section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          <SelectItem value="FEATURED">Featured Collections</SelectItem>
                          <SelectItem value="COMPLETE">Complete Collection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="px-6 py-4 border-t mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 overflow-y-auto min-h-0">
            {collection ? (
              <CollectionPreview 
                collection={collection}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Save the collection first to see a preview.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 