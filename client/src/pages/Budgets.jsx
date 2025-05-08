import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Education',
  'Shopping',
  'Other',
];

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    description: '',
    startDate: '',
    endDate: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token); // Debug log

      if (!token) {
        console.error('No token found in localStorage');
        navigate('/login');
        return;
      }

      console.log('Fetching budgets with token:', token);
      const response = await fetch('http://localhost:5000/api/budgets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      console.log('Response status:', response.status); // Debug log
      console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug log

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Token invalid or expired');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const errorData = await response.json();
        console.error('Error response data:', errorData); // Debug log
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Budgets data:', data);
      setBudgets(data);
      setError('');
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setError(error.message || 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        description: budget.description,
        startDate: budget.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : '',
        endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: '',
        amount: '',
        period: 'monthly',
        description: '',
        startDate: '',
        endDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBudget(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        navigate('/login');
        return;
      }

      console.log('Submitting budget with token:', token);
      const response = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          category: formData.category,
          amount: parseFloat(formData.amount),
          period: formData.period,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Token invalid or expired');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create budget');
      }

      const data = await response.json();
      setBudgets([...budgets, data]);
      setFormData({
        category: '',
        amount: '',
        period: 'monthly',
        description: '',
        startDate: '',
        endDate: ''
      });
      setOpenDialog(false);
      setError('');
    } catch (error) {
      console.error('Error submitting budget:', error);
      setError(error.message || 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/budgets/${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      fetchBudgets();
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateProgress = (spent, amount) => {
    const percentage = (spent / amount) * 100;
    return Math.min(percentage, 100);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category || '',
      amount: budget.amount || 0,
      period: budget.period || 'monthly',
      description: budget.description || '',
      startDate: budget.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : '',
      endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : ''
    });
    handleOpenDialog();
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
        <Typography variant="h5">Budgets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Budget
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {budgets && budgets.length > 0 ? (
          budgets.map((budget) => (
            <Grid item xs={12} md={6} lg={4} key={budget._id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {budget.category}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(budget)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(budget._id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {budget.description}
                </Typography>
                <Typography variant="h5" component="div" gutterBottom>
                  ${(budget.amount || 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Period: {budget.period}
                </Typography>
                {budget.startDate && (
                  <Typography variant="body2" color="text.secondary">
                    Start: {new Date(budget.startDate).toLocaleDateString()}
                  </Typography>
                )}
                {budget.endDate && (
                  <Typography variant="body2" color="text.secondary">
                    End: {new Date(budget.endDate).toLocaleDateString()}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            No budgets found. Add your first budget to get started!
          </Typography>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBudget ? 'Edit Budget' : 'Add Budget'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              margin="normal"
            >
              {CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
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
              inputProps={{ step: '0.01' }}
            />

            <TextField
              select
              fullWidth
              label="Period"
              name="period"
              value={formData.period}
              onChange={handleChange}
              margin="normal"
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBudget ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Budgets; 