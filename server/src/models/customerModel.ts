import mongoose, { Document, Schema, model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
  };
  mobileNumber: string;
}

const customerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
  },
  mobileNumber: {
    type: String,
    required: true,
  },
});

export const customerModel = model<ICustomer>('Customer', customerSchema);