
import { Delivery } from '../../domain/models/deliveryModel';
import { DeliveryRepositoryPort } from '../../domain/ports/deliveryRepositoryPort';
import { ProviderPort } from '../../domain/ports/providerPort';

export default class CreateDelivery {
  constructor(
    private repo: DeliveryRepositoryPort,
    private providers: Record<'NRW' | 'TLS', ProviderPort>
  ) {}

  public async execute(orderId: string) {
    console.log(`🚀 Creating delivery for order ${orderId}`);
    
    // Provider selection logic - could be enhanced with more sophisticated routing
    const providerName = this.selectProvider(orderId);
    const provider = this.providers[providerName];
    
    console.log(`📋 Selected provider: ${providerName}`);
    
    try {
      // Request label generation from selected provider
      const { labelUrl, trackingId } = await provider.generateLabel(orderId);
      
      // Calculate estimated delivery (simple logic - could be enhanced)
      const estimatedDelivery = this.calculateEstimatedDelivery(providerName);
      
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

  private selectProvider(orderId: string): 'NRW' | 'TLS' {
    // Simple provider selection - could be enhanced with:
    // - Geographic routing
    // - Load balancing
    // - Provider availability
    // - Cost optimization
    
    // For now, use hash-based selection for consistency
    const hash = orderId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return hash % 2 === 0 ? 'NRW' : 'TLS';
  }

  private calculateEstimatedDelivery(provider: string): Date {
    const now = new Date();
    
    // Provider-specific delivery estimates
    switch (provider) {
      case 'NRW':
        // NRW: 1-2 business days
        return new Date(now.getTime() + (24 + Math.random() * 24) * 60 * 60 * 1000);
      case 'TLS':
        // TLS: Same day to next day
        return new Date(now.getTime() + (4 + Math.random() * 20) * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}