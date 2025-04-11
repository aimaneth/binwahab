import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  layout: z.string().default("{}"),
  filters: z.string().default("{}"),
  sortRules: z.string().default("{}"),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryTemplateProps {
  categoryId: string;
  template: any;
  onTemplateChange: () => void;
}

export function CategoryTemplate({
  categoryId,
  template,
  onTemplateChange,
}: CategoryTemplateProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      layout: template?.layout || "{}",
      filters: template?.filters || "{}",
      sortRules: template?.sortRules || "{}",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/categories/${categoryId}/template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          filters: JSON.parse(data.filters),
          sortRules: JSON.parse(data.sortRules),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save template");
      }

      toast.success("Template saved successfully");
      onTemplateChange();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/categories/${categoryId}/template`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      toast.success("Template deleted successfully");
      form.reset();
      onTemplateChange();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="layout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Layout Configuration (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="filters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filter Configuration (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortRules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Rules (JSON)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isLoading}>
              Save Template
            </Button>
            {template && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isLoading}
              >
                Delete Template
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
} 