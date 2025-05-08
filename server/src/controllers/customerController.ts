import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { HTTP_STATUS } from '../constants/httpStatus';
import { throwError } from '../middlewares/errorMiddleware';
import { ICustomerService } from '../interfaces/IService/ICustomerService';

class CustomerController {

    constructor(
        // private _customerService: CustomerService
        private _customerService: ICustomerService

    ) {}

    async createCustomer(req: Request, res: Response): Promise<void> {
        try {
            console.log('customers',req.body)
            const{name, address, mobileNumber }= req.body;
            if (!name || !mobileNumber) {
                throwError(HTTP_STATUS.BAD_REQUEST, 'Name and mobile number are required');
                return;
              }
              
              const customer = await this._customerService.createCustomer({
                name,
                address: address || { street: '', city: '', state: '', zipCode: '' },
                mobileNumber,
              });

            res.status(HTTP_STATUS.CREATED).json({ success: true, data:customer});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success:false, error: 'Failed to create customer' });
        }
    }

    async updateCustomer(req: Request, res: Response): Promise<void> {
        try {
            console.log('customerId',req.params.customerId,'req.body',req.body)
            const { customerId }= req.params;

            if(!customerId){
                throwError(HTTP_STATUS.BAD_REQUEST, 'Customer ID is required');
                return;
            }

            const{name, address, mobileNumber }= req.body;
            if (!name || !mobileNumber) {
                throwError(HTTP_STATUS.BAD_REQUEST, 'Name and mobile number are required');
                return;
              }
              
              const updatedCustomer = await this._customerService.updateCustomer(customerId,{
                name,
                address: address || { street: '', city: '', state: '', zipCode: '' },
                mobileNumber,
              });

            res.status(HTTP_STATUS.CREATED).json({ success: true, data:updatedCustomer});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success:false, error: 'Failed to update customer' });
        }
    }

    async deleteCustomer(req: Request, res: Response): Promise<void> {
        try {
          const { id } = req.params;
          if (!id) {
            throwError(HTTP_STATUS.BAD_REQUEST, 'Customer ID is required');
            return;
          }
          await this._customerService.deleteCustomer(id);
          res.status(HTTP_STATUS.OK).json({ success: true, message: 'Customer deleted successfully' });
        } catch (error: any) {
          res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message || 'Failed to delete customer' });
        }
      }

    async getCustomers(req: Request, res: Response): Promise<void> {
        try {
            const customers = await this._customerService.getAllCustomers();
            res.status(HTTP_STATUS.OK).json({ success:true, data:customers});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success:false, error: 'Failed to fetch customers' });
        }
    }
}

export default CustomerController;