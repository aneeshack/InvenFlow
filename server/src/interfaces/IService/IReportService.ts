import { IItem } from "../../models/itemModel";
import { ISales } from "../../models/salesModel";

export interface IReportService{
    getSalesReport(startDate: Date, endDate: Date): Promise<ISales[] |null>;
    findAll(): Promise<IItem[] |null>;
    getCustomerLedger(customerId: string): Promise<ISales[] |null>;
}