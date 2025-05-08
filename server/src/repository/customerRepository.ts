import { customerModel, ICustomer } from '../models/customerModel';
import BaseRepository from './baseRepository';

class CustomerRepository extends BaseRepository<ICustomer> {
    constructor() {
        super(customerModel);
    }

}

export default CustomerRepository;