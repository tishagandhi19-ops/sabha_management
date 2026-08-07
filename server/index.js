import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';

// Import Routes
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import eventRoutes from './routes/events.js';
import attendanceRoutes from './routes/attendance.js';
import reportsRoutes from './routes/reports.js';
import sevaRoutes from './routes/sevas.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sevas', sevaRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Base route
app.get('/', (req, res) => {
  res.send('Sabha Management System API (સવારની કથા અને રવિસભા)');
});

// Self-ping Render URL every 5 minutes to prevent spin-down/sleep
const RENDER_URL = 'https://sabha-management-4pe2.onrender.com/health';
setInterval(() => {
  https.get(RENDER_URL, (res) => {
    console.log(`Self-ping to Render API status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`Self-ping to Render API failed:`, err.message);
  });
}, 5 * 60 * 1000); // 5 minutes

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sabha-management';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB database connected successfully...');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });
