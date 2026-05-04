require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const cache = require('./services/cache.service');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// GET /tasks
app.get('/tasks', async (req, res, next) => {
  try {
    const cacheKey = 'tasks:list';
    
    if (cache.has(cacheKey)) {
      console.log('Serving tasks list from cache');
      return res.status(200).json(cache.get(cacheKey));
    }

    const tasks = await prisma.task.findMany();
    cache.set(cacheKey, tasks);
    
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id
app.get('/tasks/:id', async (req, res, next) => {
  const { id } = req.params;
  const taskId = parseInt(id);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  const cacheKey = `tasks:item:${taskId}`;

  try {
    if (cache.has(cacheKey)) {
      console.log(`Serving task ${taskId} from cache`);
      return res.status(200).json(cache.get(cacheKey));
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    cache.set(cacheKey, task);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST /tasks
app.post('/tasks', async (req, res, next) => {
  const { title, description, price } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ error: 'Title and price are required' });
  }

  try {
    const newTask = await prisma.task.create({
      data: { 
        title, 
        description: description || '', 
        price: parseFloat(price) 
      }
    });

    // Invalidate list cache
    cache.delete('tasks:list');
    
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res, next) => {
  const { id } = req.params;
  const taskId = parseInt(id);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    await prisma.task.delete({
      where: { id: taskId }
    });

    // Invalidate caches
    cache.delete('tasks:list');
    cache.delete(`tasks:item:${taskId}`);
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'SideHustle API is running' });
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
