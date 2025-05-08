import { Document, model, Schema, Types } from "mongoose";

export interface ISaleItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ISales extends Document {
  items: ISaleItem[];
  customerId?: Types.ObjectId;
  customerName?: string;
  total: number;
  paymentType?: 'cash'|'credit';
  date?: Date;
  createdAt: string;
  updatedAt: string;
}

const saleSchema = new Schema({
  items: [{
    itemId: {
      type: Types.ObjectId,
      ref: 'items',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  }],
  customerId: {
    type: Types.ObjectId,
    ref: 'customers',
    default: null,
  },
  customerName: {
    type: String,
    default: 'Cash Sale',
  },
  total: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['cash', 'credit'],
    default: 'cash',
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
    timestamps:true
});

export const salesModel = model<ISales>('sales', saleSchema);