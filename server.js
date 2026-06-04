const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Routes
const resourcesRouter = require('./routes/resources');
const inventoryRouter = require('./routes/inventory');
const alertsRouter = require('./routes/alerts');
const allocationRouter = require('./routes/allocation');
const analyticsRouter = require('./routes/analytics');
const authRouter = require('./routes/auth');

// Import predictive service
const { runPredictiveAnalysis } = require('./services/predictionService');

const app = express();
const server = http.createServer(app);

// Configure CORS for Express and Socket.io
const corsOptions = {
  origin: '*', // allow all origins for easy development/testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Bind routes
app.use('/api/resources', resourcesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/allocation', allocationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'OptiWard AI API Server is active and operational.' });
});

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to the Express application state so routes can access it
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Staff client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Staff client disconnected: ${socket.id}`);
  });
});

// Run initial predictive analytics after server boots
setTimeout(() => {
  console.log('Bootstrapping: Running initial AI Predictive analysis...');
  runPredictiveAnalysis(io);
}, 3000);

// Set up background periodic AI Predictive check (every 5 minutes)
const FIVE_MINUTES = 5 * 60 * 1000;
setInterval(() => {
  runPredictiveAnalysis(io);
}, FIVE_MINUTES);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`OptiWard AI Backend is running on port ${PORT}`);
  console.log(`Socket.io engine initialized and listening for broadcasts`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});
