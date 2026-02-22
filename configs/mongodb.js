'use strict';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion_opiniones';
    
    console.log('MongoDB | Trying to connect...');
    
    await mongoose.connect(mongoUri);
    
    console.log('MongoDB | Connected successfully');
    console.log(`MongoDB | Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('MongoDB | Could not connect to MongoDB');
    console.error('MongoDB | Error:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB | Connection closed');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB | Connection closed due to app termination');
  process.exit(0);
});
