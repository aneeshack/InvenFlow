import { Router } from 'express';
import ReportController from '../controllers/reportController';
import { authenticate } from '../middlewares/authMiddlewar';
import { ReportService } from '../services/reportService';
import { saleRepository } from './salesRoutes';
import { itemRepository } from './itemRoutes';
import multer from 'multer';

const storage = multer.memoryStorage(); // store in memory, useful for email
const upload = multer({ storage });

const router = Router();
const reportService = new ReportService(saleRepository,itemRepository)
const reportController = new ReportController(reportService);

router.get('/salesReport', authenticate, reportController.getSalesReport.bind(reportController));
router.get('/items', authenticate, reportController.getItemsReport.bind(reportController));
router.get('/ledger/:customerId', authenticate, reportController.getCustomerLedger.bind(reportController));
router.post('/export', authenticate, reportController.exportReport.bind(reportController));
router.post('/send-report', authenticate, upload.single('file'), reportController.sendReport.bind(reportController));


export default router;