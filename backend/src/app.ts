import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(clerkMiddleware());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Routes
import dashboardRoutes from './routes/dashboardRoutes';
import farmRoutes from './routes/farmRoutes';
import actionRoutes from './routes/actionRoutes';
import alertRoutes from './routes/alertRoutes';
import assistantRoutes from './routes/assistantRoutes';
import reportRoutes from './routes/reportRoutes';
import cropRoutes from './routes/cropRoutes';

app.use('/api/dashboard', dashboardRoutes);
app.use('/api', farmRoutes);
app.use('/api', actionRoutes);
app.use('/api', alertRoutes);
app.use('/api', assistantRoutes);
app.use('/api', reportRoutes);
app.use('/api', cropRoutes);


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;
