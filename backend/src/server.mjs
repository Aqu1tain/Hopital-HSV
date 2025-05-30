import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

// Express setup
const app = express();

// CORS for dev: allow Expo/React Native and local frontend
app.use(cors());
app.use(express.json());

// Mount all routes
app.use('/', routes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});