import { DeliveryService } from '../../../../src/domain/services/deliveryService';
import { DeliveryRepositoryPort } from '../../../../src/domain/ports/deliveryRepositoryPort';
import { ProviderPort } from '../../../../src/domain/ports/providerPort';
import { Delivery, DeliveryStatus } from '../../../../src/domain/models/deliveryModel';

// Mock implementations for testing
class MockDeliveryRepository implements DeliveryRepositoryPort {
  async create(delivery: Delivery): Promise<Delivery> {
    return delivery;
  }
  
  async updateStatus(id: string, status: DeliveryStatus): Promise<void> {}
  
  async findById(id: string): Promise<Delivery | null> {
    return null;
  }
  
  async findByProvider(provider: string): Promise<Delivery[]> {
    return [];
  }
  
  async findByProviderAndTrackingId(provider: string, trackingId: string): Promise<Delivery | null> {
    return null;
  }
}

class MockProvider implements ProviderPort {
  async generateLabel(orderId: string): Promise<{ labelUrl: string; trackingId: string }> {
    return {
      labelUrl: 'https://mock.com/label.pdf',
      trackingId: 'MOCK-123'
    };
  }
}

describe('DeliveryService', () => {
  let deliveryService: DeliveryService;
  let mockRepository: MockDeliveryRepository;
  let mockProviders: Record<'NRW' | 'TLS', ProviderPort>;

  beforeEach(() => {
    mockRepository = new MockDeliveryRepository();
    mockProviders = {
      NRW: new MockProvider(),
      TLS: new MockProvider()
    };
    deliveryService = new DeliveryService(mockRepository, mockProviders);
  });

  describe('selectOptimalProvider', () => {
    it('should return either NRW or TLS', () => {
      const provider = deliveryService.selectOptimalProvider();
      expect(['NRW', 'TLS']).toContain(provider);
    });

    it('should return different providers over multiple calls (randomness test)', () => {
      const results = new Set();
      
      // Run the function many times to test randomness
      for (let i = 0; i < 100; i++) {
        results.add(deliveryService.selectOptimalProvider());
      }
      
      // With 100 calls, we should get both providers (very high probability)
      expect(results.size).toBeGreaterThan(1);
      expect(results.has('NRW')).toBe(true);
      expect(results.has('TLS')).toBe(true);
    });
  });

  describe('canUpdateStatus', () => {
    it('should allow valid status transitions from CREATED', () => {
      expect(deliveryService.canUpdateStatus('CREATED', 'IN_TRANSIT')).toBe(true);
      expect(deliveryService.canUpdateStatus('CREATED', 'FAILED')).toBe(true);
    });

    it('should not allow invalid status transitions from CREATED', () => {
      expect(deliveryService.canUpdateStatus('CREATED', 'DELIVERED')).toBe(false);
      expect(deliveryService.canUpdateStatus('CREATED', 'CREATED')).toBe(false);
    });

    it('should allow valid status transitions from IN_TRANSIT', () => {
      expect(deliveryService.canUpdateStatus('IN_TRANSIT', 'DELIVERED')).toBe(true);
      expect(deliveryService.canUpdateStatus('IN_TRANSIT', 'FAILED')).toBe(true);
    });

    it('should not allow invalid status transitions from IN_TRANSIT', () => {
      expect(deliveryService.canUpdateStatus('IN_TRANSIT', 'CREATED')).toBe(false);
      expect(deliveryService.canUpdateStatus('IN_TRANSIT', 'IN_TRANSIT')).toBe(false);
    });

    it('should not allow any transitions from DELIVERED', () => {
      expect(deliveryService.canUpdateStatus('DELIVERED', 'CREATED')).toBe(false);
      expect(deliveryService.canUpdateStatus('DELIVERED', 'IN_TRANSIT')).toBe(false);
      expect(deliveryService.canUpdateStatus('DELIVERED', 'FAILED')).toBe(false);
      expect(deliveryService.canUpdateStatus('DELIVERED', 'DELIVERED')).toBe(false);
    });

    it('should not allow any transitions from FAILED', () => {
      expect(deliveryService.canUpdateStatus('FAILED', 'CREATED')).toBe(false);
      expect(deliveryService.canUpdateStatus('FAILED', 'IN_TRANSIT')).toBe(false);
      expect(deliveryService.canUpdateStatus('FAILED', 'DELIVERED')).toBe(false);
      expect(deliveryService.canUpdateStatus('FAILED', 'FAILED')).toBe(false);
    });
  });

  describe('calculateEstimatedDelivery', () => {
    it('should add 2 days for NRW provider', () => {
      const now = new Date();
      const expected = new Date();
      expected.setDate(expected.getDate() + 2);
      
      const result = deliveryService.calculateEstimatedDelivery('NRW');
      
      // Allow for small time differences (seconds) in test execution
      expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('should add 3 days for TLS provider', () => {
      const now = new Date();
      const expected = new Date();
      expected.setDate(expected.getDate() + 3);
      
      const result = deliveryService.calculateEstimatedDelivery('TLS');
      
      // Allow for small time differences (seconds) in test execution
      expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('should return a future date', () => {
      const now = new Date();
      const nrwResult = deliveryService.calculateEstimatedDelivery('NRW');
      const tlsResult = deliveryService.calculateEstimatedDelivery('TLS');
      
      expect(nrwResult.getTime()).toBeGreaterThan(now.getTime());
      expect(tlsResult.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
