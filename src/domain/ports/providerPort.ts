import { DeliveryStatus } from '../models/deliveryModel';

export interface ProviderPort {
  generateLabel(orderId: string): Promise<{ labelUrl: string; trackingId: string }>;
  getStatus?(trackingId: string): Promise<DeliveryStatus>;
}