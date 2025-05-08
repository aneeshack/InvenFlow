import React, { useEffect, useState } from 'react';
import { 
  ArrowUpDown, 
  Box, 
  Download,
  Loader2, 
  Mail,
  Pencil, 
  Plus, 
  Printer,
  Search, 
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
import { InventoryItem } from '../types';
import { CLIENT_API } from '@/util/Axios';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    description: '',
    quantity: '',
    price: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; quantity?: string; price?: string }>({});

  const fetchItems = async () => {
    try {
      const response = await CLIENT_API.get('/item/getItems');
      console.log('response while fetch items', response);
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching items', error);
      toast.error('Failed to fetch items');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Validate form inputs
  const validateForm = (item: Partial<InventoryItem>) => {
    const newErrors: { name?: string; quantity?: string; price?: string } = {};
    if (!item.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (item.quantity === '' || item.quantity === undefined ) {
      newErrors.quantity = 'Quantity is required';
    } else if (typeof item.quantity === 'number' && item.quantity <= 0) {
      newErrors.quantity = 'Quantity cannot be negative or zero';
    }
    if (item.price === '' || item.price === undefined) {
      newErrors.price = 'Price is required';
    } else if (typeof item.price === 'number' && item.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new item
  const handleAdd = async () => {
    if (!validateForm(newItem)) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdItem: InventoryItem = {
        name: newItem.name || '',
        description: newItem.description || '',
        quantity: Number(newItem.quantity) || 0,
        price: Number(newItem.price) || 0,
      };

      const response = await CLIENT_API.post('/item/addItem', createdItem);
      if (response.data.success) {
        setItems([...items, response.data.data]);
        toast.success('Item added successfully');
        setNewItem({
          name: '',
          description: '',
          quantity: '',
          price: '',
        });
        setErrors({});
        setIsAddDialogOpen(false);
      } else {
        throw new Error(response.data.error || 'Failed to add item');
      }
    } catch (error: any) {
      console.error('Error adding item', error);
      toast.error(error.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update item
  const handleEdit = async () => {
    if (!currentItem || !validateForm(currentItem)) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedItem = {
        name: currentItem.name,
        description: currentItem.description,
        quantity: Number(currentItem.quantity),
        price: Number(currentItem.price),
        updatedAt: new Date().toISOString(),
      };

      const response = await CLIENT_API.put(`/item/update/${currentItem._id}`, updatedItem);
      if (response.data.success) {
        const updatedItems = items.map((item) =>
          item._id === currentItem._id ? response.data.data : item
        );
        setItems(updatedItems);
        toast.success('Item updated successfully');
        setIsEditDialogOpen(false);
        setErrors({});
      } else {
        throw new Error(response.data.error || 'Failed to update item');
      }
    } catch (error: any) {
      console.error('Error updating item', error);
      toast.error(error.message || 'Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!currentItem) return;

    setIsSubmitting(true);
    try {
      const response = await CLIENT_API.delete(`/item/delete/${currentItem._id}`);
      if (response.data.success) {
        const updatedItems = items.filter((item) => item._id !== currentItem._id);
        setItems(updatedItems);
        toast.success('Item deleted successfully');
        setIsDeleteDialogOpen(false);
      } else {
        throw new Error(response.data.error || 'Failed to delete item');
      }
    } catch (error: any) {
      console.error('Error deleting item', error);
      toast.error(error.message || 'Failed to delete item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort items based on column and direction
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sorting
  const handleSort = (column: keyof InventoryItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Mock export functions
  const handleExport = (type: 'print' | 'excel' | 'pdf' | 'email') => {
    toast.success(`Exporting inventory data as ${type}...`);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn" style={{ '--animation-delay': '100ms' } as React.CSSProperties}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your inventory items and stock levels.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            className="flex-1 sm:flex-none" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
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
                    <Box className="mr-2 h-4 w-4" /> Export as Excel
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleExport('pdf')}
                  >
                    <Box className="mr-2 h-4 w-4" /> Export as PDF
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
          placeholder="Search by name or description..."
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
                <th
                  className="px-4 py-3 text-left font-medium cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortColumn === 'name' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end">
                    Quantity
                    {sortColumn === 'quantity' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end">
                    Unit Price ($)
                    {sortColumn === 'price' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedItems.map((item) => (
                <tr key={item._id} className="bg-white hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentItem({ ...item, quantity: item.quantity || '', price: item.price || '' });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentItem(item);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </td>
                </tr>
              ))}
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No items found. Try adjusting your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new item to your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter item description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                  min="0"
                />
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Unit Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value === '' ? '' : Number(e.target.value) })}
                  min="0"
                />
                {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Make changes to the inventory item.
            </DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter item name"
                  value={currentItem.name}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, name: e.target.value })
                  }
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  placeholder="Enter item description"
                  value={currentItem.description}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    placeholder="0"
                    value={currentItem.quantity}
                    onChange={(e) =>
                      setCurrentItem({ ...currentItem, quantity: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    min="0"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Unit Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentItem.price}
                    onChange={(e) =>
                      setCurrentItem({ ...currentItem, price: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    min="0"
                  />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="py-4">
              <p className="mb-2">
                <span className="font-medium">Item:</span> {currentItem.name}
              </p>
              <p>
                <span className="font-medium">Quantity:</span> {currentItem.quantity} units
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
                'Delete Item'
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

export default Inventory;