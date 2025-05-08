import { IItem, itemModel } from '../models/itemModel';
import BaseRepository from './baseRepository';

class ItemRepository extends BaseRepository<IItem> {
    constructor() {
        super(itemModel);
    }

    async search(query: string): Promise<IItem[] | null> {
        try {
            return this.model.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }).exec();
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }
}

export default ItemRepository;