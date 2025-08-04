import { FastifyInstance } from 'fastify';
import DeliveryRepository from '../repositories/MongoDeliveryRepository';
import { DeliveryStatus } from '../../domain/models/deliveryModel';
import { DeliveryService } from '../../domain/services/deliveryService';

export default async function webhookRoutes(fastify: FastifyInstance) {
  const deliveryRepoInstance = new DeliveryRepository();
  const deliveryService = new DeliveryService(deliveryRepoInstance, {} as any); // Providers not needed for status validation

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

      // Validate status transition using domain service
      if (!deliveryService.isStatusUpdateAllowed(delivery, status)) {
        console.log(`❌ Invalid status transition for ${trackingId}: ${delivery.status} → ${status}`);
        reply.status(400).send({ 
          error: 'Invalid status transition',
          currentStatus: delivery.status,
          attemptedStatus: status,
          allowedTransitions: deliveryService.canUpdateStatus(delivery.status, 'DELIVERED') ? ['DELIVERED', 'FAILED'] : []
        });
        return;
      }
      
      await deliveryRepoInstance.updateStatus(delivery.id, status);
      console.log(`✅ TLS status updated for ${trackingId}: ${delivery.status} → ${status}`);
      console.log(`📊 Status description: ${deliveryService.getStatusDescription(status)}`);
      
      reply.code(200).send({ 
        success: true,
        deliveryId: delivery.id,
        previousStatus: delivery.status,
        newStatus: status,
        statusDescription: deliveryService.getStatusDescription(status),
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