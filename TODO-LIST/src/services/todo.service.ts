import { TodoRepository } from "../repositories/todo.repository";
import { ITodo } from "../models/todo.model";
import { AppError } from "../utils/AppError";

export class TodoService {
    private todoRepository: TodoRepository;

    constructor() {
        this.todoRepository = new TodoRepository();
    }

    async createTodo(data: Partial<ITodo>): Promise<ITodo> {
        return await this.todoRepository.create(data);
    }

    async getTodos(query: any): Promise<ITodo[]> {
        return await this.todoRepository.find(query);
    }

    async getTodoById(id: string): Promise<ITodo> {
        const todo = await this.todoRepository.findOne(id);
        if (!todo) {
            throw new AppError(404, "Todo not found");
        }
        return todo;
    }

    async updateTodo(id: string, data: Partial<ITodo>): Promise<ITodo> {
        const todo = await this.todoRepository.update(id, data);
        if (!todo) {
            throw new AppError(404, "Todo not found");
        }
        return todo;
    }

    async deleteTodo(id: string): Promise<void> {
        const success = await this.todoRepository.delete(id);
        if (!success) {
            throw new AppError(404, "Todo not found");
        }
    }
}
