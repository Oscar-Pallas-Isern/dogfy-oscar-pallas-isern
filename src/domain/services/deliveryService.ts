import { Delivery, DeliveryStatus } from '../models/deliveryModel';
import { DeliveryRepositoryPort } from '../ports/deliveryRepositoryPort';
import { ProviderPort } from '../ports/providerPort';

export class DeliveryService {
  constructor(
    private deliveryRepository: DeliveryRepositoryPort,
    private providers: Record<'NRW' | 'TLS', ProviderPort>
  ) {}

  public selectOptimalProvider(): 'NRW' | 'TLS' {
    return Math.random() < 0.5 ? 'NRW' : 'TLS';
  }

  public canUpdateStatus(currentStatus: DeliveryStatus, newStatus: DeliveryStatus): boolean {
    const statusFlow: Record<DeliveryStatus, DeliveryStatus[]> = {
      'CREATED': ['IN_TRANSIT', 'FAILED'],
      'IN_TRANSIT': ['DELIVERED', 'FAILED'],
      'DELIVERED': [],
      'FAILED': [],
    };

    return statusFlow[currentStatus].includes(newStatus);
  }

  public calculateEstimatedDelivery(provider: 'NRW' | 'TLS'): Date {
    const now = new Date();
    const daysToAdd = provider === 'NRW' ? 2 : 3;
    
    now.setDate(now.getDate() + daysToAdd);
    return now;
  }

  public isStatusUpdateAllowed(delivery: Delivery, newStatus: DeliveryStatus): boolean {
    // Prevent updates to final states
    if (delivery.status === 'DELIVERED' || delivery.status === 'FAILED') {
      return false;
    }
    
    // Use the status flow validation
    return this.canUpdateStatus(delivery.status, newStatus);
  }

  public getStatusDescription(status: DeliveryStatus): string {
    const descriptions: Record<DeliveryStatus, string> = {
      'CREATED': 'Package has been created and is awaiting pickup',
      'IN_TRANSIT': 'Package is in transit to destination',
      'DELIVERED': 'Package has been successfully delivered',
      'FAILED': 'Delivery attempt failed'
    };
    
    return descriptions[status];
  }
}
