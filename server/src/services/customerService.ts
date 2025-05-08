import { ICustomer } from "../models/customerModel";
import CustomerRepository from "../repository/customerRepository";

export class CustomerService{
    constructor(private _customerRepository: CustomerRepository) {}

    async createCustomer(customerData: Partial<ICustomer>): Promise<ICustomer> {
        try {
        
          if (!customerData.name || !customerData.mobileNumber) {
            throw new Error('Name and email are required');
          }
    
          return await this._customerRepository.create(customerData);
        } catch (error) {
          throw new Error(`Failed to create customer: ${(error as Error).message}`);
        }
      }
    
      async updateCustomer(id: string, customerData: Partial<ICustomer>): Promise<ICustomer> {
        try {
          if (!id) {
            throw new Error('Customer ID is required');
          }
          if (!customerData.name || !customerData.mobileNumber) {
            throw new Error('Name and mobile number are required');
          }
          const updatedCustomer = await this._customerRepository.update(id, customerData);
          if (!updatedCustomer) {
            throw new Error('Customer not found');
          }
          return updatedCustomer;
        } catch (error) {
          throw new Error(`Failed to update customer: ${(error as Error).message}`);
        }
      }

      async deleteCustomer(id: string): Promise<void> {
        try {
          if (!id) {
            throw new Error('Customer ID is required');
          }
          return await this._customerRepository.delete(id);
        
        } catch (error) {
          throw new Error(`Failed to delete customer: ${(error as Error).message}`);
        }
      }

      async findById(id: string): Promise<ICustomer | null> {
        try {
          const customer = await this._customerRepository.findById(id);
          return customer;
        } catch (error) {
          throw new Error(`Failed to find customer: ${(error as Error).message}`);
        }
      }
      
      async getAllCustomers(): Promise<ICustomer[]> {
        try {
          return await this._customerRepository.findAll();
        } catch (error) {
          throw new Error(`Failed to fetch customers: ${(error as Error).message}`);
        }
      }
}