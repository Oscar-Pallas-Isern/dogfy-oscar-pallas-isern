export type DeliveryStatus = 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

export interface Delivery {
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