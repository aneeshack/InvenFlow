import { ICustomer } from "../../models/customerModel";

export interface ICustomerService{
    createCustomer(customerData: Partial<ICustomer>): Promise<ICustomer>;
    updateCustomer(id: string, customerData: Partial<ICustomer>): Promise<ICustomer>
    deleteCustomer(id: string): Promise<void>;
    getAllCustomers(): Promise<ICustomer[]>;
    
}