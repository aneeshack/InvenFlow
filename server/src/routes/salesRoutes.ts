import { Router } from 'express';
import SalesController from '../controllers/salesController';
import { authenticate } from '../middlewares/authMiddlewar';
import SaleRepository from '../repository/salesRepository';
import { SalesService } from '../services/salesService';
import { itemService } from './itemRoutes';
import { custormerService } from './customerRoutes';

const router = Router();
export const saleRepository = new SaleRepository();
const saleService = new SalesService(saleRepository)
const salesController = new SalesController(saleService,itemService,custormerService);

router.post('/create', authenticate, salesController.createSale.bind(salesController));
router.put('/update/:id', authenticate, salesController.updateSale.bind(salesController));
router.get('/getSales', authenticate, salesController.getSales.bind(salesController));
router.delete('/delete/:id', authenticate, salesController.deleteSales.bind(salesController));

export default router;