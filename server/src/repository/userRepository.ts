import  { IUser, userModel } from '../models/userModel';
import BaseRepository from './baseRepository';
import bcrypt from 'bcrypt'

class UserRepository extends BaseRepository<IUser> {
    constructor() {
        super(userModel);
    }

    async create(data: Partial<IUser>): Promise<IUser> {
        try {
            const hashedPassword = await bcrypt.hash(data.password!, 10);
            return super.create({ ...data, password: hashedPassword });
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }

    async findByEmail(email: string): Promise<IUser | null> {
        try {
            return this.model.findOne({ email }).exec();
          } catch (error) {
            throw new Error(`Error fetching entities: ${(error as Error).message}`);
          }
    }
}

export default UserRepository;