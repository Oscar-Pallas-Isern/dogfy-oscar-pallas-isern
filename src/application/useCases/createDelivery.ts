
import { Delivery } from '../../domain/models/deliveryModel';
import { DeliveryRepositoryPort } from '../../domain/ports/deliveryRepositoryPort';
import { ProviderPort } from '../../domain/ports/providerPort';
import { DeliveryService } from '../../domain/services/deliveryService';

export default class CreateDelivery {
  private deliveryService: DeliveryService;

  constructor(
    private repo: DeliveryRepositoryPort,
    private providers: Record<'NRW' | 'TLS', ProviderPort>
  ) {
    this.deliveryService = new DeliveryService(repo, providers);
  }

  public async execute(orderId: string) {
    console.log(`🚀 Creating delivery for order ${orderId}`);
    
    // Use domain service for provider selection
    const providerName = this.deliveryService.selectOptimalProvider();
    const provider = this.providers[providerName];
    
    console.log(`📋 Selected provider: ${providerName}`);
    
    try {
      // Request label generation from selected provider
      const { labelUrl, trackingId } = await provider.generateLabel(orderId);
      
      // Use domain service for delivery estimation
      const estimatedDelivery = this.deliveryService.calculateEstimatedDelivery(providerName);
      
      const delivery: Delivery = {
        id: crypto.randomUUID(),
        orderId,
        provider: providerName,
        trackingId,
        labelUrl,
        status: 'CREATED',
        createdAt: new Date(),
        updatedAt: new Date(),
        estimatedDelivery
      };

      await this.repo.create(delivery);
      
      console.log(`✅ Delivery created successfully: ${delivery.id}`);
      console.log(`📦 Tracking ID: ${trackingId}`);
      console.log(`🏷️ Label URL: ${labelUrl}`);
      console.log(`📊 Status: ${this.deliveryService.getStatusDescription(delivery.status)}`);
      
      return { 
        success: true,
        data: {
          id: delivery.id,
          orderId: delivery.orderId,
          provider: delivery.provider,
          labelUrl: delivery.labelUrl,
          trackingId: delivery.trackingId,
          status: delivery.status,
          estimatedDelivery: delivery.estimatedDelivery,
          createdAt: delivery.createdAt
        }
      };
    } catch (error) {
      console.error(`❌ Failed to create delivery for order ${orderId}:`, error);
      
      // Return structured error response
      throw new Error(`Label generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}