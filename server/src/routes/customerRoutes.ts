import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddlewar';
import CustomerController from '../controllers/customerController';
import CustomerRepository from '../repository/customerRepository';
import { CustomerService } from '../services/customerService';

const router = Router();
const customerRepository = new CustomerRepository();
export const custormerService = new CustomerService(customerRepository)
const customerController = new CustomerController(custormerService);

router.post('/create', authenticate, customerController.createCustomer.bind(customerController));
router.put('/update/:customerId', authenticate, customerController.updateCustomer.bind(customerController));
router.delete('/delete/:id', authenticate, customerController.deleteCustomer.bind(customerController));
router.get('/getCustomers', authenticate, customerController.getCustomers.bind(customerController));

export default router;