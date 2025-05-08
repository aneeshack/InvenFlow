import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
}

const UserSchema: Schema = new Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    }
});

export const userModel = model<IUser>('User', UserSchema);