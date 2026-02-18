import express, { Application } from "express";
import cors from "cors";
import todoRoutes from "./routes/todo.routes";
import { errorHandler } from "./middlewares/error.middleware";

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes() {
        this.app.use("/api/v1/todos", todoRoutes);
    }

    private initializeErrorHandling() {
        this.app.use(errorHandler);
    }
}

export default new App().app;
