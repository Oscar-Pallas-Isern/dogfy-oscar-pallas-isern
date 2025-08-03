import { Delivery, DeliveryStatus } from '../models/deliveryModel';

export interface DeliveryRepositoryPort {
  create(delivery: Delivery): Promise<Delivery>;
  updateStatus(id: string, status: DeliveryStatus): Promise<void>;
  findById(id: string): Promise<Delivery | null>;
  findByProvider(provider: string): Promise<Delivery[]>;
  findByProviderAndTrackingId(provider: string, trackingId: string): Promise<Delivery | null>;
}