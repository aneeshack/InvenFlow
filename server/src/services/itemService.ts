import { IItem } from "../models/itemModel";
import ItemRepository from "../repository/itemRepository";

export class ItemService{
    constructor(private _itemRepository: ItemRepository){}

    async findById(itemId: string): Promise<IItem | null> {
      try {
      
        if (!itemId) {
          throw new Error('bad request');
        }
  
        return await this._itemRepository.findById(itemId);
      } catch (error) {
        throw new Error(`Failed to find item by id: ${(error as Error).message}`);
      }
    }

  async createItem(data: Partial<IItem>): Promise<IItem> {
      try {
        console.log('inside create itemservice')
        if (!data.name || !data.price || !data.quantity) {
          throw new Error('Name price and quantity are required');
        }
  
        const item = await this._itemRepository.create(data);
        console.log('item',item)
        return item
      } catch (error) {
        throw new Error(`Failed to create item: ${(error as Error).message}`);
      }
    }

    async findAll(): Promise<IItem[]> {
      try {
        return await this._itemRepository.findAll();
      } catch (error) {
        throw new Error(`Failed find all items: ${(error as Error).message}`);
      }
    }

    async update(id:string, data: Partial<IItem>): Promise<IItem |null> {
      try {
        if (data.quantity && data.quantity < 0) {
          throw new Error('Quantity cannot be negative');
      }
        return await this._itemRepository.update(id, data);
      } catch (error) {
        throw new Error(`Failed to update item: ${(error as Error).message}`);
      }
    }

    async delete(itemId:string): Promise< void> {
      try {
        console.log('delete in service')
        if (!itemId) {
          throw new Error('bad request');
      }
        return await this._itemRepository.delete(itemId);
      } catch (error) {
        throw new Error(`Failed to delete item: ${(error as Error).message}`);
      }
    }

    async search(query:string): Promise< IItem[] | null> {
      try {
      
        return await this._itemRepository.search(query);
      } catch (error) {
        throw new Error(`Failed to search item: ${(error as Error).message}`);
      }
    }

}