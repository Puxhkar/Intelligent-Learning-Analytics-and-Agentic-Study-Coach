import { z } from "zod";

export const createTodoSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        status: z.enum(["pending", "completed", "in-progress"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.string().or(z.date()).optional(),
        tags: z.array(z.string()).optional(),
    }),
});

export const updateTodoSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "completed", "in-progress"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.string().or(z.date()).optional(),
        tags: z.array(z.string()).optional(),
    }),
    params: z.object({
        id: z.string().min(1, "ID is required"),
    }),
});
