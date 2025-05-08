import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  Calendar, 
  Download, 
  Loader2, 
  Mail,
  Pencil, 
  Plus, 
  Printer, 
  Search, 
  ShoppingCart, 
  Trash2, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CLIENT_API } from '@/util/Axios';
import { Customer, InventoryItem, Sale, SaleItem } from '@/types';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Sale>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState<Partial<Sale>>({
    date: new Date().toISOString(),
    items: [],
    customerId: '',
    paymentType: 'cash',
    total: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQuantity, setSelectedItemQuantity] = useState(1);
  const [errors, setErrors] = useState<{
    items?: string;
    paymentType?: string;
    quantity?: string;
  }>({});

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await CLIENT_API.get('/customer/getCustomers');
      if (response.data.success) {
        setCustomers(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch customers');
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error(error.message || 'Failed to fetch customers');
    }
  };

  // Fetch inventory items
  const fetchInventoryItems = async () => {
    try {
      const response = await CLIENT_API.get('/item/getItems');
      if (response.data.success) {
        setInventoryItems(response.data.data);
        
      } else {
        throw new Error(response.data.error || 'Failed to fetch inventory items');
      }
    } catch (error: any) {
      console.error('Error fetching inventory items:', error);
      toast.error(error.message || 'Failed to fetch inventory items');
    }
  };

  // Fetch sales
  const fetchSales = async () => {
    try {
      const response = await CLIENT_API.get('/sales/getSales');
      if (response.data.success) {
        setSales(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch sales');
      }
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      toast.error(error.message || 'Failed to fetch sales');
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchInventoryItems();
    fetchSales();
  }, []);

  // Validate sale form
  const validateForm = (sale: Partial<Sale>) => {
    const newErrors: {
      items?: string;
      paymentType?: string;
      quantity?: string;
    } = {};
    if (!sale.items?.length) {
      newErrors.items = 'At least one item is required';
    }
    if (!sale.paymentType) {
      newErrors.paymentType = 'Payment type is required';
    }
    // Validate quantities against inventory
    sale.items?.forEach((item) => {
      const inventoryItem = inventoryItems.find((inv) => inv._id === item.itemId);
      if(typeof(inventoryItem.quantity)==='string'){
        inventoryItem.quantity = Number(inventoryItem.quantity)
      }

      if (inventoryItem && item.quantity && item.quantity > inventoryItem.quantity) {
        newErrors.quantity = `Quantity for ${item.name} exceeds available stock (${inventoryItem.quantity})`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add item to sale
  const addItemToSale = () => {
    if (!selectedItemId || selectedItemQuantity <= 0) {
      toast.error('Please select an item and valid quantity');
      return;
    }

    const inventoryItem = inventoryItems.find((item) => item._id === selectedItemId);
    if (!inventoryItem) {
      toast.error('Selected item not found');
      return;
    }
    if(typeof(inventoryItem.quantity)==='string'){
      inventoryItem.quantity = Number(inventoryItem.quantity)
    }
    if (selectedItemQuantity > inventoryItem.quantity) {
      toast.error(`Quantity exceeds available stock (${inventoryItem.quantity})`);
      return;
    }

    const existingItemIndex = (newSale.items || []).findIndex((item) => item.itemId === selectedItemId);

    let updatedItems: SaleItem[];
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      updatedItems = [...(newSale.items || [])];
      const oldQuantity = updatedItems[existingItemIndex].quantity;
      updatedItems[existingItemIndex].quantity = oldQuantity + selectedItemQuantity;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * inventoryItem.price;
    } else {
      if(typeof(inventoryItem.price)==='string'){
        inventoryItem.price = Number(inventoryItem.price)
      }
      // Add new item
      const newItem: SaleItem = {
        id: `temp-${Date.now()}`,
        itemId: inventoryItem._id,
        name: inventoryItem.name,
        quantity: selectedItemQuantity,
        price: inventoryItem.price ,
        total: selectedItemQuantity * inventoryItem.price ,
      };
      updatedItems = [...(newSale.items || []), newItem];
    }

    setNewSale({
      ...newSale,
      items: updatedItems,
      total: calculateTotal(updatedItems),
    });

    setSelectedItemId('');
    setSelectedItemQuantity(1);
  };

  // Remove item from sale
  const removeItemFromSale = (itemId: string) => {
    const itemToRemove = (newSale.items || []).find((item) => item.id === itemId);
    if (!itemToRemove) return;

    const updatedItems = (newSale.items || []).filter((item) => item.id !== itemId);
    setNewSale({
      ...newSale,
      items: updatedItems,
      total: calculateTotal(updatedItems),
    });
  };

  // Calculate total
  const calculateTotal = (items: SaleItem[]) => {
    return items.reduce((total, item) => total + item.total, 0);
  };

  // Add new sale
  const handleAdd = async () => {
    if (!validateForm(newSale)) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const saleData = {
        date: newSale.date || new Date().toISOString(),
        items: newSale.items || [],
        customerId: newSale.customerId || undefined,
        paymentType: newSale.paymentType || 'cash',
        total: newSale.total || 0,
      };

      // Create sale
      const saleResponse = await CLIENT_API.post('/sales/create', saleData);
      if (!saleResponse.data.success) {
        throw new Error(saleResponse.data.error || 'Failed to create sale');
      }
      setSales([...sales, saleResponse.data.data]);
      // Update inventory quantities
      for (const item of saleData.items!) {
        const inventoryItem = inventoryItems.find((inv) => inv._id === item.itemId);
        if(typeof(inventoryItem.quantity)==='string'){
          inventoryItem.quantity = Number(inventoryItem.quantity)
        }
      }

      // Update local state
     
      setNewSale({
        date: new Date().toISOString(),
        items: [],
        customerId: '',
        paymentType: 'cash',
        total: 0,
      });
      setErrors({});
      toast.success('Sale recorded successfully');

      // Refresh inventory
      await fetchInventoryItems();
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast.error(error.message || 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
      setIsAddDialogOpen(false);
    }
  };


    // Edit sale
    const openEditDialog = (sale: Sale) => {
      setCurrentSale(sale);
      setNewSale({
        date: sale.date,
        items: sale.items,
        customerId: sale.customerId,
        paymentType: sale.paymentType,
        total: sale.total,
      });
      setIsEditDialogOpen(true);
    };
  
    const handleEdit = async () => {
      if (!currentSale || !validateForm(newSale)) {
        toast.error('Please fix the form errors');
        return;
      }
  
      setIsSubmitting(true);
      try {
        const saleData = {
          date: newSale.date || new Date().toISOString(),
          items: newSale.items || [],
          customerId: newSale.customerId || undefined,
          paymentType: newSale.paymentType || 'cash',
          total: newSale.total || 0,
        };
  
        // Revert old inventory quantities
        for (const item of currentSale.items) {
          const inventoryItem = inventoryItems.find((inv) => inv._id === item.itemId);
          if (inventoryItem) {
            const currentQuantity = typeof inventoryItem.quantity === 'string' ? Number(inventoryItem.quantity) : inventoryItem.quantity;
            await CLIENT_API.put(`/item/update/${item.itemId}`, {
              quantity: currentQuantity + item.quantity,
            });
          }
        }
  
        // Update sale
        const saleResponse = await CLIENT_API.put(`/sales/update/${currentSale._id}`, saleData);
        if (!saleResponse.data.success) {
          throw new Error(saleResponse.data.error || 'Failed to update sale');
        }
  
        // Update inventory with new quantities
        for (const item of saleData.items!) {
          const inventoryItem = inventoryItems.find((inv) => inv._id === item.itemId);
          if (inventoryItem) {
            const currentQuantity = typeof inventoryItem.quantity === 'string' ? Number(inventoryItem.quantity) : inventoryItem.quantity;
            await CLIENT_API.put(`/item/update/${item.itemId}`, {
              quantity: currentQuantity - item.quantity,
            });
          }
        }
  
        // Update local state
        setSales(sales.map((s) => (s._id === currentSale._id ? saleResponse.data.data : s)));
        setNewSale({
          date: new Date().toISOString(),
          items: [],
          customerId: '',
          paymentType: 'cash',
          total: 0,
        });
        setErrors({});
        toast.success('Sale updated successfully');
        await fetchInventoryItems();
      } catch (error: any) {
        console.error('Error updating sale:', error);
        toast.error(error.message || 'Failed to update sale');
      } finally {
        setIsSubmitting(false);
        setIsEditDialogOpen(false);
        setCurrentSale(null);
      }
    };
  

  // Delete sale
  const handleDelete = async () => {
    if (!currentSale) return;

    setIsSubmitting(true);
    try {
      const response = await CLIENT_API.delete(`/sales/delete/${currentSale._id}`);
      if (response.data.success) {
        setSales(sales.filter((sale) => sale._id !== currentSale._id));
        toast.success('Sale deleted successfully');
      } else {
        throw new Error(response.data.error || 'Failed to delete sale');
      }
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast.error(error.message || 'Failed to delete sale');
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Mock export functions (unchanged)
  const handleExport = (type: 'print' | 'excel' | 'pdf' | 'email') => {
    toast.success(`Exporting sales data as ${type}...`);
    setIsExportMenuOpen(false);
  };

  // Filter sales based on search query
  const filteredSales = sales.filter(
    (sale) =>
      (sale.customerName && sale.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sale.paymentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale._id.includes(searchQuery) ||
      sale.total.toString().includes(searchQuery)
  );

  // Sort sales based on column and direction
  const sortedSales = [...filteredSales].sort((a, b) => {
    if (sortColumn === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
    
    if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sorting
  const handleSort = (column: keyof Sale) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" style={{ '--animation-delay': '100ms' } as React.CSSProperties}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">
            Record and manage your sales transactions.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            className="flex-1 sm:flex-none" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Record Sale
          </Button>
          
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex-1 sm:flex-none"
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleExport('print')}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleExport('excel')}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export as Excel
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleExport('pdf')}
                  >
                    <Download className="mr-2 h-4 w-4" /> Export as PDF
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleExport('email')}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Send via Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center border rounded-lg overflow-hidden mb-4">
        <div className="pl-3 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          placeholder="Search by customer name, payment type or sale ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="pr-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Sale ID</th>
                <th
                  className="px-4 py-3 text-left font-medium cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sortColumn === 'date' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Payment Type</th>
                <th className="px-4 py-3 text-right font-medium">Items</th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center justify-end">
                    Total
                    {sortColumn === 'total' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedSales.map((sale) => (
                <tr key={sale._id} className="bg-white hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{sale._id}</td>
                  <td className="px-4 py-3">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{sale.customerName || 'Cash Sale'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      sale.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {sale.paymentType === 'cash' ? 'Cash' : 'Credit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sale.items.length}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${sale.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentSale(sale);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Search className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(sale)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentSale(sale);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </td>
                </tr>
              ))}
              
              {sortedSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No sales found. Try adjusting your search or record a new sale.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Sale Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
            <DialogDescription>
              Add a new sales transaction to your records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={format(new Date(newSale.date || new Date()), 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      setNewSale({ ...newSale, date: newDate.toISOString() });
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer">Customer </Label>
                <Select
                  value={newSale.customerId}
                  onValueChange={(value) => setNewSale({ ...newSale, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select
                  value={newSale.paymentType}
                  onValueChange={(value: 'cash' | 'credit') => setNewSale({ ...newSale, paymentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentType && <p className="text-red-500 text-sm">{errors.paymentType}</p>}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Items</h3>
                <p className="text-sm text-muted-foreground">
                  {(newSale.items || []).length} items
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Select
                      value={selectedItemId}
                      onValueChange={setSelectedItemId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item._id} value={item._id}>
                            {item.name} - ${item.price.toFixed(2)} (Stock: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full sm:w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={selectedItemQuantity}
                      onChange={(e) => setSelectedItemQuantity(Number(e.target.value))}
                    />
                  </div>
                  
                  <Button onClick={addItemToSale} className="sm:w-auto" disabled={!selectedItemId}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
                
                {errors.items && <p className="text-red-500 text-sm">{errors.items}</p>}
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                
                {(newSale.items || []).length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Price</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                          <th className="px-3 py-2 text-center font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(newSale.items || []).map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 text-right">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              ${item.total.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItemFromSale(item.id)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right font-medium">
                            Total:
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${(newSale.total || 0).toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/10">
                    <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No items added yet. Select items above to add to this sale.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={isSubmitting || (newSale.items || []).length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Record Sale'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
        {/* Edit Sale Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>Update the details of this sales transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-date"
                    type="date"
                    value={format(new Date(newSale.date || new Date()), 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      setNewSale({ ...newSale, date: newDate.toISOString() });
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-customer">Customer</Label>
                <Select value={newSale.customerId} onValueChange={(value) => setNewSale({ ...newSale, customerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-paymentType">Payment Type</Label>
                <Select value={newSale.paymentType} onValueChange={(value: 'cash' | 'credit') => setNewSale({ ...newSale, paymentType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentType && <p className="text-red-500 text-sm">{errors.paymentType}</p>}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Items</h3>
                <p className="text-sm text-muted-foreground">{(newSale.items || []).length} items</p>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item._id} value={item._id}>
                            {item.name} - ${item.price.toFixed(2)} (Stock: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={selectedItemQuantity}
                      onChange={(e) => setSelectedItemQuantity(Number(e.target.value))}
                    />
                  </div>
                  <Button onClick={addItemToSale} className="sm:w-auto" disabled={!selectedItemId}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
                {errors.items && <p className="text-red-500 text-sm">{errors.items}</p>}
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                {(newSale.items || []).length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Price</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                          <th className="px-3 py-2 text-center font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(newSale.items || []).map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 text-right">${item.price.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-medium">${item.total.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">
                              <Button variant="ghost" size="sm" onClick={() => removeItemFromSale(item.id)}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right font-medium">Total:</td>
                          <td className="px-3 py-2 text-right font-medium">${(newSale.total || 0).toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/10">
                    <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No items added yet. Select items above to add to this sale.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setCurrentSale(null); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting || (newSale.items || []).length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Update Sale'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* View Sale Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              View the details of this sale.
            </DialogDescription>
          </DialogHeader>
          {currentSale && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Sale ID</p>
                  <p className="font-medium">{currentSale._id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(currentSale.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{currentSale.customerName || 'Cash Sale'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Type</p>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      currentSale.paymentType === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {currentSale.paymentType === 'cash' ? 'Cash' : 'Credit'}
                    </span>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium mb-2">Items</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Item</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentSale.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-right">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-medium">
                        Total:
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        ${currentSale.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sale? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentSale && (
            <div className="py-4">
              <p className="mb-2">
                <span className="font-medium">Sale ID:</span> {currentSale._id}
              </p>
              <p className="mb-2">
                <span className="font-medium">Date:</span>{' '}
                {new Date(currentSale.date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Total:</span> ${currentSale.total.toFixed(2)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Sale'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Close the export menu when clicking outside */}
      {isExportMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsExportMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Sales;