import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddlewar';
import ItemController from '../controllers/itemController';
import ItemRepository from '../repository/itemRepository';
import { ItemService } from '../services/itemService';

const router = Router();

export const itemRepository = new ItemRepository();
export const itemService = new ItemService(itemRepository)
const itemController = new ItemController(itemService);

router.post('/addItem', authenticate, itemController.createItem.bind(itemController));
router.get('/getItems', authenticate, itemController.getItems.bind(itemController));
router.put('/update/:id', authenticate, itemController.updateItem.bind(itemController));
router.delete('/delete/:id', authenticate, itemController.deleteItem.bind(itemController));
router.get('/search', authenticate, itemController.searchItems.bind(itemController));

export default router;

