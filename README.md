# Inventory Management System Backend

This is the backend implementation for the Inventory Management System using Node.js, Express, TypeScript, and MongoDB with the Repository Pattern.

## Prerequisites
- Node.js (v16 or higher)
- MongoDB
- TypeScript
- Git

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd inventory-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following:
```
MONGODB_URI=mongodb://localhost/inventory
PORT=5000
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

4. Start the MongoDB server:
```bash
mongod
```

5. Run the application:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login and get JWT token

### Inventory
- POST /api/inventory - Create new item
- GET /api/inventory - Get all items
- PUT /api/inventory/:id - Update item
- DELETE /api/inventory/:id - Delete item
- GET /api/inventory/search?query=term - Search items

### Customers
- POST /api/customers - Create new customer
- GET /api/customers - Get all customers

### Sales
- POST /api/sales - Record new sale
- GET /api/sales - Get all sales

### Reports
- GET /api/reports/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Sales report
- GET /api/reports/items - Items report
- GET /api/reports/ledger/:customerId - Customer ledger
- POST /api/reports/export - Export report (CSV/PDF/Email)

## Project Structure
```
src/
├── controllers/
├── models/
├── repositories/
├── routes/
├── middleware/
├── index.ts
```

## Technologies Used
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT for authentication
- bcrypt for password hashing
- json2csv for CSV export
- pdfkit for PDF generation
- nodemailer for email functionality