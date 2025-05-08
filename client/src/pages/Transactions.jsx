import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const TRANSACTION_TYPES = ['income', 'expense'];
const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investments', 'Other'],
  expense: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Housing', 'Healthcare', 'Education', 'Shopping', 'Other']
};

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      // Make sure we're using the data array from the response
      setTransactions(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: new Date(transaction.date).toISOString().split('T')[0],
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTransaction(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Form field changed:', name, value); // Debug log for form changes
    
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
        // Reset category when type changes
        ...(name === 'type' && { category: '' }),
      };
      console.log('Updated form data:', newData); // Debug log for updated form data
      return newData;
    });
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Debug log for form data
      console.log('Form data before validation:', formData);

      // Validate required fields
      if (!formData.type || !formData.amount || !formData.category || !formData.description) {
        console.log('Validation failed:', {
          type: formData.type,
          amount: formData.amount,
          category: formData.category,
          description: formData.description
        });
        setError('All fields are required');
        return;
      }

      // Validate amount is a positive number
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Amount must be a positive number');
        return;
      }

      // Validate category is one of the allowed values
      const allowedCategories = CATEGORIES[formData.type];
      console.log('Allowed categories for type', formData.type, ':', allowedCategories);
      console.log('Selected category:', formData.category);

      if (!allowedCategories.includes(formData.category)) {
        setError(`Invalid category for ${formData.type}. Allowed categories: ${allowedCategories.join(', ')}`);
        return;
      }

      const url = editingTransaction
        ? `http://localhost:5000/api/transactions/${editingTransaction._id}`
        : 'http://localhost:5000/api/transactions';
      
      // Format the data properly
      const formattedData = {
        type: formData.type,
        amount: amount,
        category: formData.category.trim(), // Ensure no whitespace
        description: formData.description.trim(), // Ensure no whitespace
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
      };

      // Log the exact data being sent
      console.log('Sending transaction data:', JSON.stringify(formattedData, null, 2));
      
      const response = await fetch(url, {
        method: editingTransaction ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        // Log the full error response
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Handle specific error cases
        if (response.status === 400) {
          if (data.errors) {
            // Handle validation errors
            const errorMessages = data.errors.map(err => err.msg).join(', ');
            throw new Error(errorMessages);
          } else if (data.message) {
            throw new Error(data.message);
          }
        }
        throw new Error(data.message || data.errors?.[0]?.msg || 'Failed to save transaction');
      }

      handleCloseDialog();
      // Refresh the transactions list
      await fetchTransactions();
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      fetchTransactions();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Transactions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Transaction
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(transactions) && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: transaction.type === 'income' ? 'success.main' : 'error.main',
                    }}
                  >
                    ${transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(transaction)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(transaction._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              margin="normal"
              required
            >
              {TRANSACTION_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              margin="normal"
              required
              inputProps={{ step: '0.01', min: '0' }}
            />

            <TextField
              select
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              margin="normal"
              required
              error={!formData.category && formData.type}
              helperText={!formData.category && formData.type ? 'Please select a category' : ''}
            >
              {CATEGORIES[formData.type]?.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTransaction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Transactions; 