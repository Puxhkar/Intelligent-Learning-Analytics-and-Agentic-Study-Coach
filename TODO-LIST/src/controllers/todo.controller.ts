import { Request, Response, NextFunction } from "express";
import { TodoService } from "../services/todo.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export class TodoController {
    private todoService: TodoService;

    constructor() {
        this.todoService = new TodoService();
    }

    createTodo = asyncHandler(async (req: Request, res: Response) => {
        const todo = await this.todoService.createTodo(req.body);
        res.status(201).json(new ApiResponse(201, todo, "Todo created successfully"));
    });

    getTodos = asyncHandler(async (req: Request, res: Response) => {
        const todos = await this.todoService.getTodos(req.query);
        res.status(200).json(new ApiResponse(200, todos, "Todos fetched successfully"));
    });

    getTodoById = asyncHandler(async (req: Request, res: Response) => {
        const todo = await this.todoService.getTodoById(req.params.id as string);
        res.status(200).json(new ApiResponse(200, todo, "Todo fetched successfully"));
    });

    updateTodo = asyncHandler(async (req: Request, res: Response) => {
        const todo = await this.todoService.updateTodo(req.params.id as string, req.body);
        res.status(200).json(new ApiResponse(200, todo, "Todo updated successfully"));
    });

    deleteTodo = asyncHandler(async (req: Request, res: Response) => {
        await this.todoService.deleteTodo(req.params.id as string);
        res.status(200).json(new ApiResponse(200, null, "Todo deleted successfully"));
    });
}