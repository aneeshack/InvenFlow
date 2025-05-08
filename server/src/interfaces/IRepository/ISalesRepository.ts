import { ISales } from "../../models/salesModel";

export interface ISaleRepository{
    getCustomerLedger(customerId: string): Promise<ISales[] | null>;
    getSalesReport(startDate: Date, endDate: Date): Promise<ISales[] | null>
}