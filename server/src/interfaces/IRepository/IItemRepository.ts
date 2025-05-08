import { IItem } from "../../models/itemModel";

export interface IItemRepository{
    search(query: string): Promise<IItem[] | null>
}