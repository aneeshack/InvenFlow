import { ISales, salesModel } from "../models/salesModel";
import SaleRepository from "../repository/salesRepository";

export class SalesService{
    constructor(private _saleRepository: SaleRepository){}


    async create(saleData: Partial<ISales>): Promise<ISales> {
        try {
          if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
            throw new Error('At least one item is required');
          }
          if (!saleData.total || saleData.total < 0) {
            throw new Error('Valid total is required');
          }
          if (!saleData.date) {
            throw new Error('Date is required');
          }
          for (const item of saleData.items) {
            if (!item.itemId || !item.quantity || item.quantity < 1 || !item.price || !item.name || !item.total) {
              throw new Error('Each item must have itemId, quantity, price, name, and total');
            }
          }
    
          const sale = await salesModel.create({
            ...saleData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return sale;
        } catch (error) {
          throw new Error(`Failed to create sale: ${(error as Error).message}`);
        }
      }

    async findAll(): Promise<ISales[]> {
        try {
            return await this._saleRepository.findAll();
        } catch (error) {
            throw new Error(`Failed to fetch sales: ${(error as Error).message}`);
        }
    }

    async delete(id: string): Promise<void> {
      try {
           await this._saleRepository.delete(id);
      } catch (error) {
          throw new Error(`Failed to fetch sales: ${(error as Error).message}`);
      }
  }

   async findById(id: string): Promise<ISales | null> {
        try {
        
          if (!id) {
            throw new Error('bad request');
          }
    
          return await this._saleRepository.findById(id);
        } catch (error) {
          throw new Error(`Failed to find item by id: ${(error as Error).message}`);
        }
      }
  async update(id:string, data: Partial<ISales>): Promise<ISales |null> {
        try {

          return await this._saleRepository.update(id, data);
        } catch (error) {
          throw new Error(`Failed to update item: ${(error as Error).message}`);
        }
      }
}