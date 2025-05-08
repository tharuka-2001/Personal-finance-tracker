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

const GOAL_TYPES = ['savings', 'debt', 'investment', 'purchase'];

function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    type: 'savings',
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        type: goal.type,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
        description: goal.description,
      });
    } else {
      setEditingGoal(null);
      setFormData({
        type: 'savings',
        name: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGoal(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingGoal
        ? `http://localhost:5000/api/goals/${editingGoal._id}`
        : 'http://localhost:5000/api/goals';
      
      const response = await fetch(url, {
        method: editingGoal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save goal');
      }

      handleCloseDialog();
      fetchGoals();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      fetchGoals();
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateProgress = (current, target) => {
    const percentage = (current / target) * 100;
    return Math.min(percentage, 100);
  };

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <Typography variant="h5">Financial Goals</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Goal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
          const daysRemaining = getDaysRemaining(goal.targetDate);
          return (
            <Grid item xs={12} md={6} lg={4} key={goal._id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{goal.name}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(goal)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(goal._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Progress: ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: progress >= 100 ? 'success.main' : 'primary.main',
                      },
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : 'Target date reached'}
                </Typography>
                {goal.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {goal.description}
                  </Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGoal ? 'Edit Goal' : 'Add Goal'}
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
            >
              {GOAL_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Target Amount"
              name="targetAmount"
              type="number"
              value={formData.targetAmount}
              onChange={handleChange}
              margin="normal"
              inputProps={{ step: '0.01' }}
            />

            <TextField
              fullWidth
              label="Current Amount"
              name="currentAmount"
              type="number"
              value={formData.currentAmount}
              onChange={handleChange}
              margin="normal"
              inputProps={{ step: '0.01' }}
            />

            <TextField
              fullWidth
              label="Target Date"
              name="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={handleChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingGoal ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Goals; 