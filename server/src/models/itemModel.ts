import mongoose, { Document, model } from "mongoose";

export interface IItem extends Document{
    name: string,
    description?: string,
    quantity: number,
    price: number
}


const itemSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    quantity: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    }
  },
    {
        timestamps: true
    }
);

export const itemModel = model<IItem>('items',itemSchema)