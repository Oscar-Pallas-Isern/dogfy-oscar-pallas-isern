import dotenv from 'dotenv';
dotenv.config();

import { buildServer } from './interfaces/http/server';
import { DatabaseConnection } from './infrastructure/database/connection';
import './infrastructure/crons/NRWCron'; 

const start = async () => {
  try {

    const db = DatabaseConnection.getInstance();
    await db.connect();
    console.log('📦 Connected to MongoDB');

    const server = await buildServer();
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3000');

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();