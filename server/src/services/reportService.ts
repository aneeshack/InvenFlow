import { IItem } from "../models/itemModel";
import { ISales } from "../models/salesModel";
import ItemRepository from "../repository/itemRepository";
import SaleRepository from "../repository/salesRepository";

export class ReportService{
    constructor(
        private _saleRepository: SaleRepository,
        private _itemRepository: ItemRepository
    ){}

        async getSalesReport(startDate: Date, endDate: Date): Promise<ISales[] |null> {
            try {
                return this._saleRepository.getSalesReport(startDate, endDate);
            } catch (error) {
                throw new Error(`Failed to find sales report: ${(error as Error).message}`);
            }
        }

        async findAll(): Promise<IItem[] |null> {
            try {
                return this._itemRepository.findAll();
            } catch (error) {
                throw new Error(`Failed to find all items: ${(error as Error).message}`);
            }
        }

        async getCustomerLedger(customerId: string): Promise<ISales[] |null> {
            try {
                return this._saleRepository.getCustomerLedger(customerId);
            } catch (error) {
                throw new Error(`Failed to find all items: ${(error as Error).message}`);
            }
        }
}