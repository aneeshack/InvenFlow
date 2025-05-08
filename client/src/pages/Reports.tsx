import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Download,
  FileBarChart,
  FilePieChart,
  Mail,
  Printer,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CLIENT_API } from '@/util/Axios';
import { Customer, InventoryItem, Sale, Transaction } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const COLORS = ['#4361ee', '#3f37c9', '#7209b7', '#f72585', '#4cc9f0'];

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch data
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

  const fetchCustomers = async () => {
    try {
      const response = await CLIENT_API.get('/customer/getCustomers');
      if (response.data.success) {
        setCustomers(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCustomer(response.data.data[0]._id);
        }
      } else {
        throw new Error(response.data.error || 'Failed to fetch customers');
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error(error.message || 'Failed to fetch customers');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSales(), fetchInventoryItems(), fetchCustomers()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Process sales data
  const getMonthlySales = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales: { [key: string]: number } = {};
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - 5 + i);
      return date.toLocaleString('en-US', { month: 'short' });
    });

    months.forEach((month) => (monthlySales[month] = 0));

    sales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      if (saleDate >= sixMonthsAgo) {
        const month = saleDate.toLocaleString('en-US', { month: 'short' });
        monthlySales[month] = (monthlySales[month] || 0) + sale.total;
      }
    });

    return months.map((month) => ({
      month,
      total: monthlySales[month] || 0,
    }));
  };

  const getTopSellingItems = () => {
    const itemSales: { [key: string]: { name: string; total: number } } = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!itemSales[item.itemId]) {
          itemSales[item.itemId] = { name: item.name, total: 0 };
        }
        itemSales[item.itemId].total += item.total;
      });
    });

    return Object.values(itemSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  // Process inventory data
  const getInventoryValueData = () => {
    return inventoryItems.map((item) => ({
      name: item.name,
      value: item.quantity * item.price,
    }));
  };

  const getLowStockItems = () => {
    return inventoryItems.filter((item) => item.quantity < 10).length;
  };

  // Process customer transactions
  const getCustomerTransactions = () => {
    const customerSales = sales
      .filter((sale) => sale.customerId === selectedCustomer)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const transactions: Transaction[] = [];
    let balance = 0;

    customerSales.forEach((sale, index) => {
      transactions.push({
        id: sale._id,
        date: sale.date,
        type: 'sale',
        amount: sale.total,
        description: `Purchase of ${sale.items.map((item) => item.name).join(', ')}`,
        balance: 0,
      });
      balance += sale.total;

      if (!sale.paymentType && index % 2 === 0) {
        const paymentAmount = sale.total * 0.5;
        transactions.push({
          id: `payment-${sale._id}`,
          date: new Date(new Date(sale.date).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'payment',
          amount: -paymentAmount,
          description: 'Payment received',
          balance: 0,
        });
        balance -= paymentAmount;
      }
    });

    let runningBalance = 0;
    transactions.forEach((tx) => {
      runningBalance += tx.amount;
      tx.balance = runningBalance;
    });

    return transactions;
  };

  // Calculate summary metrics
  const salesData = getMonthlySales();
  const totalSales = salesData.reduce((sum, month) => sum + month.total, 0);
  const averageSale = totalSales / (salesData.length || 1);
  const bestMonth = salesData.reduce(
    (max, curr) => (curr.total > max.total ? curr : max),
    salesData[0] || { month: '', total: 0 }
  );

  const totalInventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const totalInventoryItems = inventoryItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const lowStockItems = getLowStockItems();
  const topSellingItems = getTopSellingItems();
  const inventoryValueData = getInventoryValueData();
  const transactions = getCustomerTransactions();
  const currentBalance = transactions.length
    ? transactions[transactions.length - 1].balance
    : 0;

  // Export functions
  const handleExport = async (type: 'print' | 'excel' | 'pdf' | 'email') => {
    try {
      if (type === 'print') {
        window.print();
      } else if (type === 'excel') {
        let data: any[] = [];
        let sheetName = '';
        let fileName = '';

        if (activeTab === 'sales') {
          data = salesData.map((item) => ({
            Month: item.month,
            'Total Sales ($)': item.total.toFixed(2),
          }));
          sheetName = 'Sales Report';
          fileName = 'sales_report.xlsx';
        } else if (activeTab === 'items') {
          data = inventoryItems.map((item) => ({
            Item: item.name,
            Description: item.description,
            Quantity: item.quantity,
            'Price ($)': item.price.toFixed(2),
            'Total Value ($)': (item.quantity * item.price).toFixed(2),
          }));
          sheetName = 'Items Report';
          fileName = 'items_report.xlsx';
        } else if (activeTab === 'customer') {
          data = transactions.map((tx) => ({
            Date: new Date(tx.date).toLocaleDateString(),
            Type: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
            Description: tx.description,
            'Amount ($)': (tx.amount < 0 ? '-' : '') + Math.abs(tx.amount).toFixed(2),
            'Balance ($)': tx.balance.toFixed(2),
          }));
          sheetName = 'Customer Ledger';
          fileName = 'customer_ledger.xlsx';
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
        toast.success(`Exported ${activeTab} report as Excel`);
      } else if (type === 'pdf') {
        const doc = new jsPDF();
        let fileName = '';

        if (activeTab === 'sales') {
          doc.text('Sales Report', 14, 20);
          autoTable(doc, {
            startY: 30,
            head: [['Month', 'Total Sales ($)']],
            body: salesData.map((item) => [item.month, item.total.toFixed(2)]),
          });
          fileName = 'sales_report.pdf';
        } else if (activeTab === 'items') {
          doc.text('Items Report', 14, 20);
          autoTable(doc, {
            startY: 30,
            head: [['Item', 'Description', 'Quantity', 'Price ($)', 'Total Value ($)']],
            body: inventoryItems.map((item) => [
              item.name,
              item.description,
              item.quantity,
              item.price.toFixed(2),
              (item.quantity * item.price).toFixed(2),
            ]),
          });
          fileName = 'items_report.pdf';
        } else if (activeTab === 'customer') {
          doc.text('Customer Ledger', 14, 20);
          autoTable(doc, {
            startY: 30,
            head: [['Date', 'Type', 'Description', 'Amount ($)', 'Balance ($)']],
            body: transactions.map((tx) => [
              new Date(tx.date).toLocaleDateString(),
              tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
              tx.description,
              (tx.amount < 0 ? '-' : '') + Math.abs(tx.amount).toFixed(2),
              tx.balance.toFixed(2),
            ]),
          });
          fileName = 'customer_ledger.pdf';
        }

        // Add chart image if chartRef exists
        if (chartRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const canvas = await html2canvas(chartRef.current);
          const imgData = canvas.toDataURL('image/png');
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth() - 28;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addPage();
          doc.text('Chart', 14, 20);
          doc.addImage(imgData, 'PNG', 14, 30, pdfWidth, pdfHeight);
        }

        doc.save(fileName);
        toast.success(`Exported ${activeTab} report as PDF`);
      } else if (type === 'email') {
        const doc = new jsPDF();
        let fileName = '';

        if (activeTab === 'sales') {
          doc.text('Sales Report', 14, 20);
          autoTable(doc, {
            startY: 30,
            head: [['Month', 'Total Sales ($)']],
            body: salesData.map((item) => [item.month, item.total.toFixed(2)]),
          });
          fileName = 'sales_report.pdf';
        } else if (activeTab === 'items') {
          doc.text('Items Report', 14, 20);
          autoTable(doc, {
            startY: 30,
            head: [['Item', 'Description', 'Quantity', 'Price ($)', 'Total Value ($)']],
            body: inventoryItems.map((item) => [
              item.name,
              item.description,
              item.quantity,
              item.price.toFixed(2),
              (item.quantity * item.price).toFixed(2),
            ]),
          });
          fileName = 'items_report.pdf';
        } else if (activeTab === 'customer') {
          doc.text('Customer Ledger', 14, 20);
          autoTable(doc, {
            startY: 30,
            head: [['Date', 'Type', 'Description', 'Amount ($)', 'Balance ($)']],
            body: transactions.map((tx) => [
              new Date(tx.date).toLocaleDateString(),
              tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
              tx.description,
              (tx.amount < 0 ? '-' : '') + Math.abs(tx.amount).toFixed(2),
              tx.balance.toFixed(2),
            ]),
          });
          fileName = 'customer_ledger.pdf';
        }

        // Add chart image if chartRef exists
        if (chartRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const canvas = await html2canvas(chartRef.current);
          const imgData = canvas.toDataURL('image/png');
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth() - 28;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addPage();
          doc.text('Chart', 14, 20);
          doc.addImage(imgData, 'PNG', 14, 30, pdfWidth, pdfHeight);
        }

        const blob = doc.output('blob');
        const formData = new FormData();
        formData.append('file', blob, fileName);

        // Prompt for recipient email
        const recipient = prompt(`Enter recipient email for ${activeTab} report:`);
        if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
          toast.error('Invalid or no email provided');
          return;
        }

        formData.append('recipient', recipient);
        formData.append('subject', `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`);
        formData.append('body', `Attached is the ${activeTab} report from your Inventory Management System.`);

        await CLIENT_API.post('/report/send-report', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`Sent ${activeTab} report via email to ${recipient}`);
      }
    } catch (error: any) {
      console.error(`Error exporting ${activeTab} report as ${type}:`, error);
      toast.error(`Failed to export ${activeTab} report as ${type}`);
    }
    setIsExportMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" style={{ '--animation-delay': '100ms' } as React.CSSProperties}>
      <style>
        {`
          @media print {
            .no-print, .no-print * {
              display: none !important;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .printable {
              width: 100%;
              font-size: 12px;
            }
          }
        `}
      </style>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">View detailed reports of your inventory system.</p>
        </div>
        <div className="relative">
          <Button variant="outline" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
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
                  <FileBarChart className="mr-2 h-4 w-4" /> Export as Excel
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => handleExport('pdf')}
                >
                  <FilePieChart className="mr-2 h-4 w-4" /> Export as PDF
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

      <Tabs defaultValue="sales" className="w-full printable" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6 no-print">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="items">Items Report</TabsTrigger>
          <TabsTrigger value="customer">Customer Ledger</TabsTrigger>
        </TabsList>

        {/* Sales Report Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">For the last 6 months</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${averageSale.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bestMonth.month || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">${bestMonth.total.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={chartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                    <Legend />
                    <Bar dataKey="total" name="Sales ($)" fill="#4361ee" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSellingItems.length > 0 ? (
                    topSellingItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full bg-invenflow-blue`}
                            style={{ opacity: 1 - i * 0.15 }}
                          />
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <div>
                          <p className="font-medium">${item.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No sales data available.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sales Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Sales ($)"
                      stroke="#7209b7"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Report Tab */}
        <TabsContent value="items" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInventoryItems}</div>
                <p className="text-xs text-muted-foreground">Units in stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Inventory worth</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems}</div>
                <p className="text-xs text-muted-foreground">Items need restock</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={chartRef}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Value']} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" />
                      <Pie
                        data={inventoryValueData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {inventoryValueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={inventoryItems.map((item) => ({
                      name: item.name,
                      quantity: item.quantity,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" name="Quantity" fill="#4361ee">
                      {inventoryItems.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Item</th>
                      <th className="px-4 py-3 text-left font-medium">Description</th>
                      <th className="px-4 py-3 text-right font-medium">Quantity</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-right font-medium">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventoryItems.map((item) => (
                      <tr key={item._id} className="bg-white hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${(item.quantity * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-medium">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${totalInventoryValue.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Ledger Tab */}
        <TabsContent value="customer" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 no-print">
            <div className="w-full sm:w-64">
              <label className="text-sm font-medium mb-2 block">Select Customer</label>
              <select
                className="form-input w-full"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const customer = customers.find((c) => c._id === selectedCustomer);
                return customer ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mobile</p>
                      <p className="font-medium">{customer.mobileNumber}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{`${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.pinCode}`}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Please select a customer</p>
                );
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Description</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="bg-white hover:bg-muted/30">
                        <td className="px-4 py-3">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              transaction.type === 'sale'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{transaction.description}</td>
                        <td
                          className={`px-4 py-3 text-right ${
                            transaction.amount < 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${transaction.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No transactions found for this customer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-medium">
                        Current Balance:
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${currentBalance.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Balance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={chartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={transactions.map((t) => ({
                      date: new Date(t.date).toLocaleDateString(),
                      balance: t.balance,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Balance']} />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name="Balance ($)"
                      stroke="#4361ee"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isExportMenuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsExportMenuOpen(false)} />
      )}
    </div>
  );
};

export default Reports;