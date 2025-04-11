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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";

// Define the variant schema
const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  attributes: z.array(
    z.object({
      name: z.string().min(1, "Attribute name is required"),
      value: z.string().min(1, "Attribute value is required"),
    })
  ),
});

type VariantFormValues = z.infer<typeof variantSchema>;

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes: {
    name: string;
    value: string;
  }[];
}

interface ProductVariantsProps {
  productId: string;
  variants: ProductVariant[];
  onVariantChange: () => void;
}

export function ProductVariants({
  productId,
  variants,
  onVariantChange,
}: ProductVariantsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      sku: "",
      name: "",
      price: 0,
      stock: 0,
      attributes: [{ name: "", value: "" }],
    },
  });

  const onSubmit = async (data: VariantFormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add variant");
      }

      toast.success("Variant added successfully");
      form.reset();
      onVariantChange();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add variant");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/products/${productId}/variants/${variantId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete variant");
      }

      toast.success("Variant deleted successfully");
      onVariantChange();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete variant");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addAttributeField = () => {
    const currentAttributes = form.getValues("attributes");
    form.setValue("attributes", [
      ...currentAttributes,
      { name: "", value: "" },
    ]);
  };

  const removeAttributeField = (index: number) => {
    const currentAttributes = form.getValues("attributes");
    if (currentAttributes.length > 1) {
      form.setValue(
        "attributes",
        currentAttributes.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Variant List</TabsTrigger>
            <TabsTrigger value="add">Add Variant</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {variants.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No variants found. Add your first variant.
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <h4 className="font-medium">{variant.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {variant.sku}
                      </p>
                      <p className="text-sm">
                        Price: ${variant.price.toFixed(2)} | Stock: {variant.stock}
                      </p>
                      {variant.attributes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {variant.attributes.map((attr, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                            >
                              {attr.name}: {attr.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(variant.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Stock Keeping Unit (unique identifier)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Display name for this variant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Variant Attributes</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAttributeField}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Attribute
                    </Button>
                  </div>

                  {form.watch("attributes").map((_, index) => (
                    <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`attributes.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Attribute Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`attributes.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Value</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeAttributeField(index)}
                          className="mb-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Variant"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 