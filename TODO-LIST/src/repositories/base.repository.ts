import { Model, Document, UpdateQuery } from "mongoose";
import { IWrite, IRead } from "../interfaces/common.interface";
import { ApiFeatures } from "../utils/apiFeatures";

export abstract class BaseRepository<T extends Document> implements IWrite<T>, IRead<T> {
    protected readonly _model: Model<T>;

    constructor(model: Model<T>) {
        this._model = model;
    }

    async create(item: Partial<T>): Promise<T> {
        return await this._model.create(item);
    }

    async update(id: string, item: UpdateQuery<T>): Promise<T | null> {
        return await this._model.findByIdAndUpdate(id, item, { new: true, runValidators: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await this._model.findByIdAndDelete(id);
        return !!result;
    }

    async find(query: any): Promise<T[]> {
        const features = new ApiFeatures(this._model.find(), query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        return await features.query;
    }

    async findOne(id: string): Promise<T | null> {
        return await this._model.findById(id);
    }
}
