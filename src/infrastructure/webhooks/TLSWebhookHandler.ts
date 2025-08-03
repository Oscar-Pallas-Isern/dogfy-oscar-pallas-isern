import { FastifyInstance } from 'fastify';
import DeliveryRepository from '../repositories/MongoDeliveryRepository';
import { DeliveryStatus } from '../../domain/models/deliveryModel';

export default async function webhookRoutes(fastify: FastifyInstance) {
  const deliveryRepoInstance = new DeliveryRepository();

  fastify.post('/tls', async (request, reply) => {
    try {
      console.log('📨 TLS Webhook received:', request.body);
      
      const { trackingId, status } = request.body as { trackingId: string; status: DeliveryStatus };
      
      if (!trackingId || !status) {
        reply.status(400).send({ 
          error: 'Missing required fields', 
          required: ['trackingId', 'status'] 
        });
        return;
      }
      
      const validStatuses: DeliveryStatus[] = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
      if (!validStatuses.includes(status)) {
        reply.status(400).send({ 
          error: 'Invalid status', 
          validStatuses 
        });
        return;
      }
      
      const delivery = await deliveryRepoInstance.findByProviderAndTrackingId('TLS', trackingId);
      
      if (!delivery) {
        console.log(`⚠️  TLS delivery not found for trackingId: ${trackingId}`);
        reply.status(404).send({ 
          error: 'Delivery not found',
          trackingId 
        });
        return;
      }
      
      if (delivery.status === status) {
        console.log(`ℹ️  Status unchanged for ${trackingId}: ${status}`);
        reply.code(200).send({ 
          success: true, 
          message: 'Status unchanged',
          currentStatus: status 
        });
        return;
      }
      
      await deliveryRepoInstance.updateStatus(delivery.id, status);
      console.log(`✅ TLS status updated for ${trackingId}: ${delivery.status} → ${status}`);
      
      reply.code(200).send({ 
        success: true,
        deliveryId: delivery.id,
        previousStatus: delivery.status,
        newStatus: status,
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('❌ TLS webhook error:', error);
      reply.status(500).send({ 
        error: 'Internal server error processing webhook' 
      });
    }
  });
}