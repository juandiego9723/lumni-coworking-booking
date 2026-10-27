import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import quoteRoutes from './routes/quoteRoutes';
import bookingRoutes from './routes/bookingRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/quotes', quoteRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

export default app;
