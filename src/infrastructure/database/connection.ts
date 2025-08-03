import mongoose from 'mongoose';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(uri: string = 'mongodb://mongo:27017/dogfydiet'): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw error;
    }
  }

  public getConnection() {
    return mongoose.connection;
  }
}
