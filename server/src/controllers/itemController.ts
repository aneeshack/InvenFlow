import { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ItemService } from '../services/itemService';
import { throwError } from '../middlewares/errorMiddleware';
import { IItemService } from '../interfaces/IService/IItemService';

class ItemController {

    constructor(
        // private _itemService: ItemService
        private _itemService: IItemService
    ) {}

    async createItem(req: Request, res: Response): Promise<void> {
        try {
            console.log('created item',req.body)
            const { name, description, quantity, price}= req.body;
            if(!name  || !quantity || !price){
                throwError(HTTP_STATUS.BAD_REQUEST, 'All fields are required');
                return
            }

            const item = await this._itemService.createItem(req.body);
            res.status(HTTP_STATUS.CREATED).json({success: true, data:item});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success:false, error: 'Failed to create item' });
        }
    }

    async getItems(req: Request, res: Response): Promise<void> {
        try {
            console.log('inside get items')
            const items = await this._itemService.findAll();
            console.log('all the items', items)
            res.status(HTTP_STATUS.OK).json({success: true, data:items});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success:false, error: 'Failed to fetch items' });
        }
    }

    async updateItem(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            
            if(!id){
                throwError(HTTP_STATUS.BAD_REQUEST,'Bad request')
            }

            const item = await this._itemService.update(id, req.body);

            if (!item) {
                res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Item not found' });
                return;
            }
            res.status(HTTP_STATUS.OK).json({success:true, data:item});
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success:false, error: 'Failed to update item' });
        }
    }

    async deleteItem(req: Request, res: Response): Promise<void> {
        try {
            const itemId = req.params.id;
            console.log('items  id is',itemId)
            if(!itemId){
                throwError(HTTP_STATUS.BAD_REQUEST, 'bad request')
                return
            }
            await this._itemService.delete(itemId);
            res.status(HTTP_STATUS.OK).json({success: true});
        } catch (error) {
            console.log('error in controller',error)
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success:false, error: 'Failed to delete item' });
        }
    }

    async searchItems(req: Request, res: Response): Promise<void> {
        try {
            const { query } = req.query;
            console.log('query,',query)
            const items = await this._itemService.search(query as string);
            res.json(items);
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success:false, error: 'Failed to search items' });
        }
    }
}

export default ItemController;