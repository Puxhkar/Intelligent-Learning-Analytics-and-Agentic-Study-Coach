import { Router } from "express";
import { TodoController } from "../controllers/todo.controller";
import { validate } from "../middlewares/validate.middleware";
import { createTodoSchema, updateTodoSchema } from "../models/todo.validation";

const router = Router();
const todoController = new TodoController();

router.post("/", validate(createTodoSchema), todoController.createTodo);
router.get("/", todoController.getTodos);
router.get("/:id", todoController.getTodoById);
router.put("/:id", validate(updateTodoSchema), todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);

export default router;
