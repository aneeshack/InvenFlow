
// Type for Inventory Item
export interface InventoryItem {
  _id?: string;
  name?: string;
  description?: string;
  quantity?: number| '';
  price?: number| '';
  createdAt?: string;
  updatedAt?: string;
}


export interface Customer {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
  };
  mobileNumber: string;
  createdAt: string;
  updatedAt: string;
}

// Type for Sale Item
export interface SaleItem {
  id?: string;
  itemId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
}


// Type for Sale
export interface Sale {
  _id: string;
  items?: SaleItem[];
  customerId?: string;
  customerName?: string;
  total?: number;
  paymentType?: 'cash' | 'credit';
  date?: string;
  createdAt: string;
  updatedAt: string;
}


// Report Types
export interface SalesReport {
  period: string;
  totalSales: number;
  totalItems: number;
  topSellingItems: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockItems: InventoryItem[];
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  topCustomers: {
    id: string;
    name: string;
    totalPurchases: number;
    totalSpent: number;
  }[];
}

// Type for Transaction in customer ledger
export interface Transaction {
  id: string;
  date: string;
  type: 'sale' | 'payment' | 'return';
  amount: number;
  description: string;
  balance: number;
}

// Type for Customer Ledger
export interface CustomerLedger {
  customer: Customer;
  transactions: Transaction[];
  totalBalance: number;
}
