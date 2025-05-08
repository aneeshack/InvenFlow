import { ISales, salesModel } from '../models/salesModel';
import BaseRepository from './baseRepository';

class SaleRepository extends BaseRepository<ISales> {
    constructor() {
        super(salesModel);
    }

    async getCustomerLedger(customerId: string): Promise<ISales[] | null> {
        try {
            return this.model.find({ customerId }).populate('itemId').exec();
        } catch (error) {
            throw new Error(`Error fetching custormer ledger: ${(error as Error).message}`);
        }
    }

    async getSalesReport(startDate: Date, endDate: Date): Promise<ISales[] | null> {
        try {
            return this.model.find({
                date: { $gte: startDate, $lte: endDate }
            }).populate('itemId customerId').exec();
    
        } catch (error) {
            throw new Error(`Error fetching sales report: ${(error as Error).message}`);
        }
    }
}

export default SaleRepository;