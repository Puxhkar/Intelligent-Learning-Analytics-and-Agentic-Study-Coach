import { BaseRepository } from "./base.repository";
import { ITodo, TodoModel } from "../models/todo.model";

export class TodoRepository extends BaseRepository<ITodo> {
    constructor() {
        super(TodoModel);
    }
}
