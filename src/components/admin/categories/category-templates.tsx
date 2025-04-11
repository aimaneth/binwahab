import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  layout: z.string().min(1, "Layout is required"),
  displayMode: z.string().min(1, "Display mode is required"),
  sortBy: z.string().min(1, "Sort by is required"),
  sortOrder: z.string().min(1, "Sort order is required"),
  itemsPerPage: z.string().min(1, "Items per page is required"),
  showFilters: z.boolean().default(true),
  showPagination: z.boolean().default(true),
  showBreadcrumbs: z.boolean().default(true),
  showCategoryDescription: z.boolean().default(true),
  customFilters: z.string().optional(),
  customSorting: z.string().optional(),
  customCss: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryTemplatesProps {
  categoryId: string;
  initialData?: {
    layout?: string;
    displayMode?: string;
    sortBy?: string;
    sortOrder?: string;
    itemsPerPage?: string;
    showFilters?: boolean;
    showPagination?: boolean;
    showBreadcrumbs?: boolean;
    showCategoryDescription?: boolean;
    customFilters?: string;
    customSorting?: string;
    customCss?: string;
  };
  onSave?: () => void;
}

const LAYOUT_OPTIONS = [
  { value: "grid", label: "Grid Layout" },
  { value: "list", label: "List Layout" },
  { value: "masonry", label: "Masonry Layout" },
  { value: "carousel", label: "Carousel Layout" },
];

const DISPLAY_MODE_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
  { value: "createdAt", label: "Date Added" },
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Rating" },
];

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: "12", label: "12 items" },
  { value: "24", label: "24 items" },
  { value: "36", label: "36 items" },
  { value: "48", label: "48 items" },
];

type StringFieldType = {
  value: string;
  onChange: (value: string) => void;
};

type BooleanFieldType = {
  value: boolean;
  onChange: (value: boolean) => void;
};

type TextareaFieldType = {
  value: string | undefined;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export function CategoryTemplates({ categoryId, initialData, onSave }: CategoryTemplatesProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      layout: initialData?.layout || "grid",
      displayMode: initialData?.displayMode || "standard",
      sortBy: initialData?.sortBy || "name",
      sortOrder: initialData?.sortOrder || "asc",
      itemsPerPage: initialData?.itemsPerPage || "24",
      showFilters: initialData?.showFilters ?? true,
      showPagination: initialData?.showPagination ?? true,
      showBreadcrumbs: initialData?.showBreadcrumbs ?? true,
      showCategoryDescription: initialData?.showCategoryDescription ?? true,
      customFilters: initialData?.customFilters || "",
      customSorting: initialData?.customSorting || "",
      customCss: initialData?.customCss || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/categories/${categoryId}/template`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save template settings");
      }
      
      toast.success("Template settings saved successfully");
      if (onSave) onSave();
    } catch (error) {
      toast.error("Failed to save template settings");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="layout" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="layout" className="space-y-4">
                <FormField
                  control={form.control}
                  name="layout"
                  render={({ field }: { field: StringFieldType }) => (
                    <FormItem>
                      <FormLabel>Layout Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LAYOUT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how products are displayed in this category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displayMode"
                  render={({ field }: { field: StringFieldType }) => (
                    <FormItem>
                      <FormLabel>Display Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select display mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISPLAY_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the level of detail for product display
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sortBy"
                    render={({ field }: { field: StringFieldType }) => (
                      <FormItem>
                        <FormLabel>Sort By</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sort field" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }: { field: StringFieldType }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sort order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SORT_ORDER_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="itemsPerPage"
                  render={({ field }: { field: StringFieldType }) => (
                    <FormItem>
                      <FormLabel>Items Per Page</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select items per page" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="display" className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="showFilters"
                    render={({ field }: { field: BooleanFieldType }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Filters</FormLabel>
                          <FormDescription>
                            Display filter options for products
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="showPagination"
                    render={({ field }: { field: BooleanFieldType }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Pagination</FormLabel>
                          <FormDescription>
                            Display pagination controls
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="showBreadcrumbs"
                    render={({ field }: { field: BooleanFieldType }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Breadcrumbs</FormLabel>
                          <FormDescription>
                            Display navigation breadcrumbs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="showCategoryDescription"
                    render={({ field }: { field: BooleanFieldType }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Category Description</FormLabel>
                          <FormDescription>
                            Display the category description at the top
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="customFilters"
                  render={({ field }: { field: TextareaFieldType }) => (
                    <FormItem>
                      <FormLabel>Custom Filters</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Define custom filter options in JSON format"
                          className="font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Advanced filter configuration in JSON format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customSorting"
                  render={({ field }: { field: TextareaFieldType }) => (
                    <FormItem>
                      <FormLabel>Custom Sorting</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Define custom sorting options in JSON format"
                          className="font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Advanced sorting configuration in JSON format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customCss"
                  render={({ field }: { field: TextareaFieldType }) => (
                    <FormItem>
                      <FormLabel>Custom CSS</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add custom CSS for this category"
                          className="font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Custom CSS styles for this category page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Template Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 