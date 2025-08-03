import { ProviderPort } from '../../domain/ports/providerPort';
import { DeliveryStatus } from '../../domain/models/deliveryModel';

class NRWProvider implements ProviderPort {
  async generateLabel(orderId: string) {
    console.log(`📦 NRW Provider: Generating label for order ${orderId}`);
    
    const trackingId = `NRW${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const labelResponse = await this.simulateNRWLabelAPI(orderId, trackingId);
    
    console.log(`✅ NRW Provider: Label generated - ${labelResponse.labelUrl}`);
    
    return {
      labelUrl: labelResponse.labelUrl,
      trackingId: trackingId,
    };
  }

  private async simulateNRWLabelAPI(orderId: string, trackingId: string) {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const labelId = `lbl_${trackingId.toLowerCase()}_${Date.now()}`;
    const labelUrl = `https://api.nrw-logistics.com/v2/labels/${labelId}.pdf`;
    
    if (Math.random() < 0.02) {
      throw new Error('NRW API: Label generation failed - service temporarily unavailable');
    }
    
    return {
      labelUrl,
      labelId,
      format: 'PDF',
      size: 'A4',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  async getStatus(trackingId: string): Promise<DeliveryStatus> {
    console.log(`🔍 NRW Provider: Polling status for ${trackingId}`);
    
    const hash = trackingId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const random = (hash % 100) / 100;
    
    if (random < 0.02) return 'CREATED';
    if (random < 0.1) return 'FAILED';
    if (random < 0.4) return 'DELIVERED';
    return 'IN_TRANSIT';
  }
}

export { NRWProvider };