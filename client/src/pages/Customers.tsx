import React, { useEffect, useState } from 'react';
import { 
  ArrowUpDown, 
  Download, 
  Loader2, 
  Mail, 
  Pencil, 
  Plus, 
  Printer, 
  Search, 
  Trash2, 
  Users, 
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
import { CLIENT_API } from '@/util/Axios';
import { Customer } from '@/types';


const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    address: { street: '', city: '', state: '', pinCode: '' },
    mobileNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    mobileNumber?: string;
  }>({});

  // Fetch customers from backend
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Validate form inputs
  const validateForm = (customer: Partial<Customer>) => {
    const newErrors: {
      name?: string;
      street?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      mobileNumber?: string;
    } = {};
    if (!customer.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!customer.address?.street?.trim()) {
      newErrors.street = 'Street is required';
    }
    if (!customer.address?.city?.trim()) {
      newErrors.city = 'City is required';
    }
    if (!customer.address?.state?.trim()) {
      newErrors.state = 'State is required';
    }
    if (!customer.address?.pinCode?.trim()) {
      newErrors.pinCode = 'Pin code is required';
    }
    if (!customer.mobileNumber?.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(customer.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new customer
  const handleAdd = async () => {
    if (!validateForm(newCustomer)) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdCustomer = {
        name: newCustomer.name || '',
        address: {
          street: newCustomer.address?.street || '',
          city: newCustomer.address?.city || '',
          state: newCustomer.address?.state || '',
          pinCode: newCustomer.address?.pinCode || '',
        },
        mobileNumber: newCustomer.mobileNumber || '',
      };

      console.log('Creating customer:', createdCustomer);
      const response = await CLIENT_API.post('/customer/create', createdCustomer);
      if (response.data.success) {
        setCustomers([...customers, response.data.data]);
        toast.success('Customer added successfully');
        setNewCustomer({
          name: '',
          address: { street: '', city: '', state: '', pinCode: '' },
          mobileNumber: '',
        });
        setErrors({});
        setIsAddDialogOpen(false);
      } else {
        throw new Error(response.data.error || 'Failed to add customer');
      }
    } catch (error: any) {
      console.error('Error adding customer:', error);
      toast.error(error.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update customer
  const handleEdit = async () => {
    if (!currentCustomer || !validateForm(currentCustomer)) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedCustomer = {
        name: currentCustomer.name,
        address: {
          street: currentCustomer.address.street,
          city: currentCustomer.address.city,
          state: currentCustomer.address.state,
          pinCode: currentCustomer.address.pinCode,
        },
        mobileNumber: currentCustomer.mobileNumber,
        updatedAt: new Date().toISOString(),
      };

      console.log('Updating customer:', updatedCustomer);
      const response = await CLIENT_API.put(`/customer/update/${currentCustomer._id}`, updatedCustomer);
      if (response.data.success) {
        const updatedCustomers = customers.map((customer) =>
          customer._id === currentCustomer._id ? response.data.data : customer
        );
        setCustomers(updatedCustomers);
        toast.success('Customer updated successfully');
        setIsEditDialogOpen(false);
        setErrors({});
      } else {
        throw new Error(response.data.error || 'Failed to update customer');
      }
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error(error.message || 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete customer
  const handleDelete = async () => {
    if (!currentCustomer) return;

    setIsSubmitting(true);
    try {
      const response = await CLIENT_API.delete(`/customer/delete/${currentCustomer._id}`);
      if (response.data.success) {
        const updatedCustomers = customers.filter((customer) => customer._id !== currentCustomer._id);
        setCustomers(updatedCustomers);
        toast.success('Customer deleted successfully');
        setIsDeleteDialogOpen(false);
      } else {
        throw new Error(response.data.error || 'Failed to delete customer');
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.pinCode.includes(searchQuery) ||
      customer.mobileNumber.includes(searchQuery)
  );

  // Sort customers based on column and direction
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];
    if (sortColumn === 'address') {
      aValue = `${a.address.street}, ${a.address.city}`;
      bValue = `${b.address.street}, ${b.address.city}`;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sorting
  const handleSort = (column: keyof Customer) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Mock export functions
  const handleExport = (type: 'print' | 'excel' | 'pdf' | 'email') => {
    toast.success(`Exporting customer data as ${type}...`);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn" style={{ '--animation-delay': '100ms' } as React.CSSProperties}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database and information.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            className="flex-1 sm:flex-none" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Customer
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
          placeholder="Search customers by name, address, or mobile..."
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
                <th className="px-4 py-3 text-left font-medium">Address</th>
                <th
                  className="px-4 py-3 text-left font-medium cursor-pointer"
                  onClick={() => handleSort('mobileNumber')}
                >
                  <div className="flex items-center">
                    Mobile
                    {sortColumn === 'mobileNumber' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedCustomers.map((customer) => (
                <tr key={customer._id} className="bg-white hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {`${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.pinCode}`}
                  </td>
                  <td className="px-4 py-3">{customer.mobileNumber}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentCustomer(customer);
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
                        setCurrentCustomer(customer);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </td>
                </tr>
              ))}
              {sortedCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No customers found. Try adjusting your search or add a new customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                placeholder="Enter street address"
                value={newCustomer.address?.street}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address!, street: e.target.value },
                  })
                }
              />
              {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={newCustomer.address?.city}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address!, city: e.target.value },
                  })
                }
              />
              {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Enter state"
                value={newCustomer.address?.state}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address!, state: e.target.value },
                  })
                }
              />
              {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinCode">Pin Code</Label>
              <Input
                id="pinCode"
                placeholder="Enter pin code"
                value={newCustomer.address?.pinCode}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address!, pinCode: e.target.value },
                  })
                }
              />
              {errors.pinCode && <p className="text-red-500 text-sm">{errors.pinCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                placeholder="Enter mobile number"
                value={newCustomer.mobileNumber}
                onChange={(e) => setNewCustomer({ ...newCustomer, mobileNumber: e.target.value })}
              />
              {errors.mobileNumber && <p className="text-red-500 text-sm">{errors.mobileNumber}</p>}
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
                'Add Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Make changes to the customer information.
            </DialogDescription>
          </DialogHeader>
          {currentCustomer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter customer name"
                  value={currentCustomer.name}
                  onChange={(e) =>
                    setCurrentCustomer({ ...currentCustomer, name: e.target.value })
                  }
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-street">Street</Label>
                <Input
                  id="edit-street"
                  placeholder="Enter street address"
                  value={currentCustomer.address.street}
                  onChange={(e) =>
                    setCurrentCustomer({
                      ...currentCustomer,
                      address: { ...currentCustomer.address, street: e.target.value },
                    })
                  }
                />
                {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  placeholder="Enter city"
                  value={currentCustomer.address.city}
                  onChange={(e) =>
                    setCurrentCustomer({
                      ...currentCustomer,
                      address: { ...currentCustomer.address, city: e.target.value },
                    })
                  }
                />
                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  placeholder="Enter state"
                  value={currentCustomer.address.state}
                  onChange={(e) =>
                    setCurrentCustomer({
                      ...currentCustomer,
                      address: { ...currentCustomer.address, state: e.target.value },
                    })
                  }
                />
                {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pinCode">Pin Code</Label>
                <Input
                  id="edit-pinCode"
                  placeholder="Enter pin code"
                  value={currentCustomer.address.pinCode}
                  onChange={(e) =>
                    setCurrentCustomer({
                      ...currentCustomer,
                      address: { ...currentCustomer.address, pinCode: e.target.value },
                    })
                  }
                />
                {errors.pinCode && <p className="text-red-500 text-sm">{errors.pinCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobileNumber">Mobile Number</Label>
                <Input
                  id="edit-mobileNumber"
                  placeholder="Enter mobile number"
                  value={currentCustomer.mobileNumber}
                  onChange={(e) =>
                    setCurrentCustomer({ ...currentCustomer, mobileNumber: e.target.value })
                  }
                />
                {errors.mobileNumber && <p className="text-red-500 text-sm">{errors.mobileNumber}</p>}
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
              Are you sure you want to delete this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentCustomer && (
            <div className="py-4">
              <p className="mb-2">
                <span className="font-medium">Customer:</span> {currentCustomer.name}
              </p>
              <p>
                <span className="font-medium">Contact:</span> {currentCustomer.mobileNumber}
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
                'Delete Customer'
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

export default Customers;