import { ISales } from "../../models/salesModel";

export interface ISaleService{
    create(saleData: Partial<ISales>): Promise<ISales>;
    findAll(): Promise<ISales[]>
}