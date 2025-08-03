import CreateDelivery from '../../../../src/application/useCases/createDelivery';
import { DeliveryRepositoryPort } from '../../../../src/domain/ports/deliveryRepositoryPort';
import { ProviderPort } from '../../../../src/domain/ports/providerPort';
import { Delivery } from '../../../../src/domain/models/deliveryModel';

// Mock implementations
class MockDeliveryRepository implements DeliveryRepositoryPort {
  private deliveries: Delivery[] = [];
  
  async create(delivery: Delivery): Promise<Delivery> {
    this.deliveries.push(delivery);
    return delivery;
  }
  
  async updateStatus(id: string, status: any): Promise<void> {
    const delivery = this.deliveries.find(d => d.id === id);
    if (delivery) {
      delivery.status = status;
      delivery.updatedAt = new Date();
    }
  }
  
  async findById(id: string): Promise<Delivery | null> {
    return this.deliveries.find(d => d.id === id) || null;
  }
  
  async findByProvider(provider: string): Promise<Delivery[]> {
    return this.deliveries.filter(d => d.provider === provider);
  }
  
  async findByProviderAndTrackingId(provider: string, trackingId: string): Promise<Delivery | null> {
    return this.deliveries.find(d => d.provider === provider && d.trackingId === trackingId) || null;
  }
}

class MockProvider implements ProviderPort {
  constructor(private providerName: string) {}
  
  async generateLabel(orderId: string): Promise<{ labelUrl: string; trackingId: string }> {
    // Simulate the enhanced label generation with realistic URLs
    const trackingId = `${this.providerName}${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const labelId = `lbl_${trackingId.toLowerCase()}_${Date.now()}`;
    
    const baseUrl = this.providerName === 'NRW' 
      ? 'https://api.nrw-logistics.com/v2/labels'
      : 'https://shipping.tls-express.com/api/v1/documents/labels';
    
    return {
      labelUrl: `${baseUrl}/${labelId}.pdf`,
      trackingId: trackingId
    };
  }
  
  async getStatus(trackingId: string) {
    return 'IN_TRANSIT' as const;
  }
}

describe('CreateDelivery Use Case', () => {
  let createDelivery: CreateDelivery;
  let mockRepository: MockDeliveryRepository;
  let mockProviders: Record<'NRW' | 'TLS', ProviderPort>;

  beforeEach(() => {
    mockRepository = new MockDeliveryRepository();
    mockProviders = {
      NRW: new MockProvider('NRW'),
      TLS: new MockProvider('TLS')
    };
    createDelivery = new CreateDelivery(mockRepository, mockProviders);
  });

  it('should create a delivery with enhanced response format', async () => {
    const orderId = 'test-order-123';
    
    const result = await createDelivery.execute(orderId);
    
    // Check the enhanced response structure
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('orderId', orderId);
    expect(result.data).toHaveProperty('provider');
    expect(result.data).toHaveProperty('labelUrl');
    expect(result.data).toHaveProperty('trackingId');
    expect(result.data).toHaveProperty('status', 'CREATED');
    expect(result.data).toHaveProperty('estimatedDelivery');
    expect(result.data).toHaveProperty('createdAt');
    
    // Check that provider is either NRW or TLS
    expect(['NRW', 'TLS']).toContain(result.data.provider);
    
    // Check realistic label URL format
    const expectedPattern = result.data.provider === 'NRW' 
      ? /https:\/\/api\.nrw-logistics\.com\/v2\/labels\/.*\.pdf/
      : /https:\/\/shipping\.tls-express\.com\/api\/v1\/documents\/labels\/.*\.pdf/;
    expect(result.data.labelUrl).toMatch(expectedPattern);
  });

  it('should save the delivery to the repository', async () => {
    const orderId = 'test-order-456';
    
    const result = await createDelivery.execute(orderId);
    
    // Verify successful response
    expect(result.success).toBe(true);
    
    // Verify that delivery was saved
    const deliveries = await mockRepository.findByProvider('NRW');
    const tlsDeliveries = await mockRepository.findByProvider('TLS');
    
    expect(deliveries.length + tlsDeliveries.length).toBe(1);
    
    // Verify the saved delivery matches the response
    const savedDelivery = [...deliveries, ...tlsDeliveries][0];
    expect(savedDelivery.id).toBe(result.data.id);
    expect(savedDelivery.orderId).toBe(orderId);
  });

  it('should generate a unique ID for each delivery', async () => {
    const orderId = 'test-order-789';
    
    const result1 = await createDelivery.execute(orderId);
    const result2 = await createDelivery.execute(orderId);
    
    // Verify both successful
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    
    const nrwDeliveries = await mockRepository.findByProvider('NRW');
    const tlsDeliveries = await mockRepository.findByProvider('TLS');
    const allDeliveries = [...nrwDeliveries, ...tlsDeliveries];
    
    expect(allDeliveries).toHaveLength(2);
    expect(allDeliveries[0].id).not.toBe(allDeliveries[1].id);
    expect(result1.data.id).not.toBe(result2.data.id);
  });

  it('should set delivery status to CREATED initially', async () => {
    const orderId = 'test-order-status';
    
    const result = await createDelivery.execute(orderId);
    
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('CREATED');
    
    const nrwDeliveries = await mockRepository.findByProvider('NRW');
    const tlsDeliveries = await mockRepository.findByProvider('TLS');
    const allDeliveries = [...nrwDeliveries, ...tlsDeliveries];
    
    expect(allDeliveries[0].status).toBe('CREATED');
  });

  it('should use the provider to generate realistic label URLs', async () => {
    const orderId = 'test-order-provider';
    
    const result = await createDelivery.execute(orderId);
    
    expect(result.success).toBe(true);
    expect(result.data.labelUrl).toBeTruthy();
    expect(result.data.trackingId).toBeTruthy();
    
    // Verify realistic URL format based on provider
    if (result.data.provider === 'NRW') {
      expect(result.data.labelUrl).toMatch(/https:\/\/api\.nrw-logistics\.com\/v2\/labels\/.*\.pdf/);
      expect(result.data.trackingId).toMatch(/^NRW\d+/);
    } else {
      expect(result.data.labelUrl).toMatch(/https:\/\/shipping\.tls-express\.com\/api\/v1\/documents\/labels\/.*\.pdf/);
      expect(result.data.trackingId).toMatch(/^TLS\d+/);
    }
  });

  it('should set createdAt and updatedAt timestamps with estimated delivery', async () => {
    const orderId = 'test-order-timestamps';
    const startTime = new Date();
    
    const result = await createDelivery.execute(orderId);
    
    expect(result.success).toBe(true);
    expect(result.data.createdAt).toBeInstanceOf(Date);
    expect(result.data.estimatedDelivery).toBeDefined();
    
    const nrwDeliveries = await mockRepository.findByProvider('NRW');
    const tlsDeliveries = await mockRepository.findByProvider('TLS');
    const delivery = [...nrwDeliveries, ...tlsDeliveries][0];
    
    expect(delivery.createdAt).toBeInstanceOf(Date);
    expect(delivery.updatedAt).toBeInstanceOf(Date);
    expect(delivery.estimatedDelivery).toBeInstanceOf(Date);
    expect(delivery.createdAt.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
    
    // Estimated delivery should be in the future
    expect(delivery.estimatedDelivery!.getTime()).toBeGreaterThan(delivery.createdAt.getTime());
  });

  it('should handle provider selection consistently', async () => {
    const orderId = 'consistent-test-order';
    
    // Execute multiple times with same order ID
    const results = await Promise.all([
      createDelivery.execute(orderId + '1'),
      createDelivery.execute(orderId + '2'),
      createDelivery.execute(orderId + '3')
    ]);
    
    // All should be successful
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(['NRW', 'TLS']).toContain(result.data.provider);
    });
    
    // Should have created 3 deliveries
    const nrwDeliveries = await mockRepository.findByProvider('NRW');
    const tlsDeliveries = await mockRepository.findByProvider('TLS');
    expect(nrwDeliveries.length + tlsDeliveries.length).toBe(3);
  });

  it('should include all required fields in response', async () => {
    const orderId = 'test-complete-response';
    
    const result = await createDelivery.execute(orderId);
    
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: expect.any(String),
        orderId: orderId,
        provider: expect.stringMatching(/^(NRW|TLS)$/),
        labelUrl: expect.stringMatching(/^https:\/\//),
        trackingId: expect.any(String),
        status: 'CREATED',
        estimatedDelivery: expect.any(Date),
        createdAt: expect.any(Date)
      })
    });
  });
});
