import { Model, Document } from 'mongoose';

abstract class BaseRepository<T extends Document> {
    protected model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(data: Partial<T>): Promise<T> {
        try {
          console.log('inside create in repo')
            const result = await this.model.create(data);
            console.log('result in base repo',result)
            return result
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }

    async findById(id: string): Promise<T | null> {
        try {
            return this.model.findById(id).exec();
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }

    async findAll(): Promise<T[]> {
        try {
            return this.model.find().exec();
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        try {
            return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }

    async delete(id: string): Promise<void> {
        try {
          console.log('delete from repository')
            await this.model.findByIdAndDelete(id).exec();
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }
}

export default BaseRepository;