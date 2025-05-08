import { Request, Response } from 'express';
import { SalesService } from '../services/salesService';
import { ItemService } from '../services/itemService';
import { ISaleService } from '../interfaces/IService/ISalesService';
import { IItemService } from '../interfaces/IService/IItemService';
import { throwError } from '../middlewares/errorMiddleware';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ICustomerService } from '../interfaces/IService/ICustomerService';
import { CustomerService } from '../services/customerService';
import { Types } from 'mongoose';
import { ISaleItem } from '../models/salesModel';

// interface SaleItemInput {
//     itemId: string;
//     name: string;
//     quantity: number;
//     price: number;
//     total: number;
//   }
  
class SalesController {
   
    constructor( 
        // private _saleService: SalesService,
        // private _itemService: ItemService
        private _saleService: SalesService,
        private _itemService: IItemService,
        private _customerService: CustomerService
    ) {
    }

    // async createSale(req: Request, res: Response): Promise<void> {
    //     try {
    //         console.log('inside create sale')
            
    //         const { itemId, quantity } = req.body;
    //         const item = await this._itemService.findById(itemId);
            
    //         if (!item || item.quantity < quantity) {
    //             res.status(400).json({ error: 'Insufficient stock' });
    //             return;
    //         }

    //         await this._itemService.update(itemId, { quantity: item.quantity - quantity });
    //         const sale = await this._saleService.create(req.body);
    //         res.status(201).json({success:true, data:sale});
    //     } catch (error) {
    //         console.log('error in create sale',error)
    //         res.status(500).json({ error: 'Failed to create sale' });
    //     }
    // }

    async createSale(req: Request, res: Response): Promise<void> {
        try {
            console.log('create sales',req.body)
          const { items, customerId, paymentType, date } = req.body;
    
          if (!items || !Array.isArray(items) || items.length === 0) {
            throwError(HTTP_STATUS.BAD_REQUEST, 'At least one item is required');
            return;
          }
    
          if (!date) {
            throwError(HTTP_STATUS.BAD_REQUEST, 'Date is required');
            return;
          }
    
          // Validate items
          const validatedItems: ISaleItem[] = [];
          for (const item of items) {
            if (!item.itemId || !item.quantity || item.quantity < 1 || !item.price || !item.name || !item.total) {
              throwError(HTTP_STATUS.BAD_REQUEST, 'Each item must have itemId, quantity, price, name, and total');
              return;
            }
    
            const inventoryItem = await this._itemService.findById(item.itemId);
            if (!inventoryItem) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Item not found: ${item.itemId}`);
              return;
            }
            if (inventoryItem.quantity < item.quantity) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Insufficient stock for ${item.name}`);
              return;
            }
            if (inventoryItem.price !== item.price) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Price mismatch for ${item.name}`);
              return;
            }
            if (item.total !== item.quantity * item.price) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Total mismatch for ${item.name}`);
              return;
            }
    
            validatedItems.push({
              itemId: item.itemId,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              total: item.total,
            });
          }
    
          // Validate customer if provided
          let customerName = 'Cash Sale';
          if (customerId) {
            const customer = await this._customerService.findById(customerId);
            if (!customer) {
              throwError(HTTP_STATUS.BAD_REQUEST, 'Customer not found');
              return;
            }
            customerName = customer.name;
          }
    
          // Calculate total
          const total = validatedItems.reduce((sum, item) => sum + item.total, 0);
    
          // Update inventory
          for (const item of validatedItems) {
            const inventoryItem = await this._itemService.findById(item.itemId);
            if (inventoryItem) {
              await this._itemService.update(item.itemId, {
                quantity: inventoryItem.quantity - item.quantity,
              });
            }
          }
    
          // Create sale
          const saleData = {
            items: validatedItems,
            customerId: customerId,
            customerName,
            total,
            paymentType,
            date: new Date(date),
          };
          const sale = await this._saleService.create(saleData);
          console.log('the sales',sale)
    
          res.status(HTTP_STATUS.CREATED).json({
            success: true,
            data: sale,
          });
        } catch (error: any) {
          console.error('Error in create sale:', error);
          res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message || 'Failed to create sale',
          });
        }
      }

      async updateSale(req: Request, res: Response): Promise<void> {
        try {
          const { id } = req.params;
          const { items, customerId, paymentType, date } = req.body;
      
          // Validate sale ID
          const existingSale = await this._saleService.findById(id);
          if (!existingSale) {
            throwError(HTTP_STATUS.NOT_FOUND, 'Sale not found');
            return;
          }
      
          // Validate input
          if (!items || !Array.isArray(items) || items.length === 0) {
            throwError(HTTP_STATUS.BAD_REQUEST, 'At least one item is required');
            return;
          }
      
          if (!date) {
            throwError(HTTP_STATUS.BAD_REQUEST, 'Date is required');
            return;
          }
      
          // Validate items
          const validatedItems: ISaleItem[] = [];
          for (const item of items) {
            if (!item.itemId || !item.quantity || item.quantity < 1 || !item.price || !item.name || !item.total) {
              throwError(HTTP_STATUS.BAD_REQUEST, 'Each item must have itemId, quantity, price, name, and total');
              return;
            }
      
            const inventoryItem = await this._itemService.findById(item.itemId);
            if (!inventoryItem) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Item not found: ${item.itemId}`);
              return;
            }
            if (inventoryItem.price !== item.price) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Price mismatch for ${item.name}`);
              return;
            }
            if (item.total !== item.quantity * item.price) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Total mismatch for ${item.name}`);
              return;
            }
      
            validatedItems.push({
              itemId: item.itemId,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              total: item.total,
            });
          }
      
          // Validate customer if provided
          let customerName = 'Cash Sale';
          if (customerId) {
            const customer = await this._customerService.findById(customerId);
            if (!customer) {
              throwError(HTTP_STATUS.BAD_REQUEST, 'Customer not found');
              return;
            }
            customerName = customer.name;
          }
      
          // Revert inventory quantities from original sale
          for (const item of existingSale.items) {
            const inventoryItem = await this._itemService.findById(item.itemId);
            if (inventoryItem) {
              await this._itemService.update(item.itemId, {
                quantity: inventoryItem.quantity + item.quantity,
              });
            }
          }
      
          // Validate new inventory quantities
          for (const item of validatedItems) {
            const inventoryItem = await this._itemService.findById(item.itemId);
            if (!inventoryItem) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Item not found: ${item.itemId}`);
              return;
            }
            if (inventoryItem.quantity < item.quantity) {
              throwError(HTTP_STATUS.BAD_REQUEST, `Insufficient stock for ${item.name}`);
              return;
            }
          }
      
          // Update inventory with new quantities
          for (const item of validatedItems) {
            const inventoryItem = await this._itemService.findById(item.itemId);
            if (inventoryItem) {
              await this._itemService.update(item.itemId, {
                quantity: inventoryItem.quantity - item.quantity,
              });
            }
          }
      
          // Calculate total
          const total = validatedItems.reduce((sum, item) => sum + item.total, 0);
      
          // Update sale
          const saleData = {
            items: validatedItems,
            customerId: customerId || null,
            customerName,
            total,
            paymentType,
            date: new Date(date),
            updatedAt: new Date().toISOString(),
          };
          const updatedSale = await this._saleService.update(id, saleData);
      
          res.status(HTTP_STATUS.OK).json({
            success: true,
            data: updatedSale,
          });
        } catch (error: any) {
          console.error('Error in update sale:', error);
          res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message || 'Failed to update sale',
          });
        }
      }

    async getSales(req: Request, res: Response): Promise<void> {
        try {
            const sales = await this._saleService.findAll();
            res.json({success: true, data:sales});
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    }

    async deleteSales(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            if(!id){
                throwError(HTTP_STATUS.BAD_REQUEST,'Failed in deleting sales')
            }
            const sales = await this._saleService.delete(id);
            res.json({success: true, data:sales});
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    }
}

export default SalesController;