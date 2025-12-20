import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

// ROUTES
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import documentRoutes from './routes/documents.js';
import applicationRoutes from './routes/applications.js';
import eventRoutes from './routes/events.js';
import preApplicationRoutes from './routes/preApplication.js';


EventEmitter.defaultMaxListeners = 20;

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://meo-services.onrender.com"
    ],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' data: https://fonts.gstatic.com;
    img-src 'self' data: blob: https:;
    connect-src 
        'self'
        http://localhost:5000
        http://localhost:5173
        http://localhost:5174
        https://meo-online-services.onrender.com
        https://meo-sv.onrender.com
        https://meo-backup.onrender.com
        https://www.google-analytics.com
        https://isaacdarcilla.github.io;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    `
      .replace(/\s{2,}/g, " ")
      .trim()
  );
  next();
});


// STATIC UPLOAD FOLDER - DISABLED (Files now stored in MongoDB)
// app.use(
//     '/uploads',
//     express.static(path.join(process.cwd(), 'uploads'))
// );

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/pre-application', preApplicationRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
} else {
  // In development, return helpful 404 for non-API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && req.path !== '/health') {
      return res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.path} not found. In development, use http://localhost:5173 for the frontend.`,
        tip: 'API endpoints are available at /api/*'
      });
    }
    next();
  });
}


// CONNECT DB AND START SERVER
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((error) => {
  console.error('Failed to connect to MongoDB. Server not started.');
  process.exit(1);
});

export default app;
