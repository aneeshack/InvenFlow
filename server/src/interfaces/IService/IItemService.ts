import { IItem } from "../../models/itemModel";

export interface IItemService{
    findById(itemId: string): Promise<IItem | null>;
    createItem(data: Partial<IItem>): Promise<IItem>;
    findAll(): Promise<IItem[]>;
    update(id:string, data: Partial<IItem>): Promise<IItem |null>;
    delete(itemId:string): Promise< void>;
    search(query:string): Promise< IItem[] | null>
}