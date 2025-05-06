# Personal Finance Tracker API

A RESTful API for managing personal finances, built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Transaction management (income and expenses)
- Budget tracking and monitoring
- Financial goals management
- Multi-currency support
- Detailed financial reports and analytics

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Express Validator for input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal-finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance-tracker
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Transactions

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/:id` - Get single transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/monthly` - Get monthly statistics

### Budgets

- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create a new budget
- `GET /api/budgets/:id` - Get single budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/:id/progress` - Get budget progress

### Goals

- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create a new goal
- `GET /api/goals/:id` - Get single goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `PUT /api/goals/:id/progress` - Update goal progress

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Error Handling

The API returns consistent error responses in the following format:

```json
{
    "success": false,
    "message": "Error message here"
}
```

## Data Models

### User
- name: String (required)
- email: String (required, unique)
- password: String (required)
- role: String (enum: ['user', 'admin'])
- currency: String (default: 'USD')

### Transaction
- user: ObjectId (reference to User)
- type: String (enum: ['income', 'expense'])
- amount: Number (required)
- category: String (required)
- description: String (required)
- date: Date
- tags: [String]
- isRecurring: Boolean
- recurringPattern: String (enum: ['daily', 'weekly', 'monthly', 'yearly'])
- currency: String

### Budget
- user: ObjectId (reference to User)
- category: String (required)
- amount: Number (required)
- period: String (enum: ['daily', 'weekly', 'monthly', 'yearly'])
- startDate: Date
- endDate: Date
- notifications: Object

### Goal
- user: ObjectId (reference to User)
- name: String (required)
- targetAmount: Number (required)
- currentAmount: Number
- startDate: Date
- targetDate: Date (required)
- category: String (required)
- status: String (enum: ['Not Started', 'In Progress', 'Completed', 'Abandoned'])
- priority: String (enum: ['Low', 'Medium', 'High'])

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 