import mongoose, { Schema, Document } from "mongoose";

export interface ITodo extends Document {
    title: string;
    description?: string;
    status: "pending" | "completed" | "in-progress";
    priority: "low" | "medium" | "high";
    dueDate?: Date;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const TodoSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        status: {
            type: String,
            enum: ["pending", "completed", "in-progress"],
            default: "pending",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        dueDate: { type: Date },
        tags: { type: [String], default: [] },
    },
    { timestamps: true }
);

export const TodoModel = mongoose.model<ITodo>("Todo", TodoSchema);
