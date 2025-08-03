import { Delivery, DeliveryStatus } from '../../../../src/domain/models/deliveryModel';

describe('Delivery Domain Model', () => {
  it('should create a valid delivery object', () => {
    const delivery: Delivery = {
      id: 'test-id-123',
      orderId: 'order-456',
      provider: 'NRW',
      labelUrl: 'https://example.com/label.pdf',
      trackingId: 'NRW-123456',
      status: 'CREATED',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    expect(delivery.id).toBe('test-id-123');
    expect(delivery.orderId).toBe('order-456');
    expect(delivery.provider).toBe('NRW');
    expect(delivery.labelUrl).toBe('https://example.com/label.pdf');
    expect(delivery.trackingId).toBe('NRW-123456');
    expect(delivery.status).toBe('CREATED');
    expect(delivery.createdAt).toBeInstanceOf(Date);
    expect(delivery.updatedAt).toBeInstanceOf(Date);
  });

  it('should accept valid provider values', () => {
    const nrwDelivery: Delivery = {
      id: 'test-id-1',
      orderId: 'order-1',
      provider: 'NRW',
      labelUrl: 'https://example.com/label1.pdf',
      trackingId: 'NRW-123',
      status: 'CREATED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tlsDelivery: Delivery = {
      id: 'test-id-2',
      orderId: 'order-2',
      provider: 'TLS',
      labelUrl: 'https://example.com/label2.pdf',
      trackingId: 'TLS-456',
      status: 'CREATED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(nrwDelivery.provider).toBe('NRW');
    expect(tlsDelivery.provider).toBe('TLS');
  });

  it('should accept all valid delivery statuses', () => {
    const statuses: DeliveryStatus[] = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
    
    statuses.forEach(status => {
      const delivery: Delivery = {
        id: `test-id-${status}`,
        orderId: 'order-123',
        provider: 'NRW',
        labelUrl: 'https://example.com/label.pdf',
        trackingId: 'NRW-123456',
        status: status,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(delivery.status).toBe(status);
    });
  });

  it('should have all required fields', () => {
    const delivery: Delivery = {
      id: 'test-id-123',
      orderId: 'order-456',
      provider: 'TLS',
      labelUrl: 'https://example.com/label.pdf',
      trackingId: 'TLS-789',
      status: 'IN_TRANSIT',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Verify all properties exist and are not undefined
    expect(delivery.id).toBeDefined();
    expect(delivery.orderId).toBeDefined();
    expect(delivery.provider).toBeDefined();
    expect(delivery.labelUrl).toBeDefined();
    expect(delivery.trackingId).toBeDefined();
    expect(delivery.status).toBeDefined();
    expect(delivery.createdAt).toBeDefined();
    expect(delivery.updatedAt).toBeDefined();
  });
});
