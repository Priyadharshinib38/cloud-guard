import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import findingsRoutes from './routes/findingsRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

import {
  notFoundHandler,
  errorHandler,
} from './middleware/errorHandler.js';

const app = express();

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   REQUEST LOGGER
========================================================= */

if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );
    next();
  });
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'CloudGuard Security Backend',
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use('/api', authRoutes);

app.use('/api', dashboardRoutes);

app.use('/api', scanRoutes);

app.use('/api', findingsRoutes);

/*
  Reports routes:

  GET /api/reports
  GET /api/reports/:id/pdf
  GET /api/reports/:id/download
*/
app.use('/api', reportsRoutes);

/* =========================================================
   404 HANDLER
========================================================= */

app.use(notFoundHandler);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(errorHandler);

export default app;