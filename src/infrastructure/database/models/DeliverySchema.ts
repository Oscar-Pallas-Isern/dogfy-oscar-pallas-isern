import mongoose, { Document, Schema } from 'mongoose';
import { Delivery, DeliveryStatus } from '../../../domain/models/deliveryModel';

// Create a MongoDB document interface based on our Delivery model
export interface DeliveryDocument extends Document {
  id: string;
  orderId: string;
  provider: 'NRW' | 'TLS';
  labelUrl: string;
  trackingId: string;
  status: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
}

const deliverySchema = new Schema<DeliveryDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    enum: ['NRW', 'TLS'],
    required: true,
  },
  labelUrl: {
    type: String,
    required: true,
  },
  trackingId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
    required: true,
    default: 'CREATED',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  estimatedDelivery: {
    type: Date,
    required: false,
  },
});

deliverySchema.pre('save', function(next) {
  (this as any).updatedAt = new Date();
  next();
});

deliverySchema.index({ provider: 1 });
deliverySchema.index({ trackingId: 1 });
deliverySchema.index({ provider: 1, trackingId: 1 });
deliverySchema.index({ id: 1 }, { unique: true });

export const DeliveryModel = mongoose.model<DeliveryDocument>('Delivery', deliverySchema);
