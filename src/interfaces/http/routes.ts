import { FastifyInstance } from 'fastify';
import CreateDelivery from '../../application/useCases/createDelivery';
import DeliveryRepository from '../../infrastructure/repositories/MongoDeliveryRepository';
import { NRWProvider } from '../../infrastructure/providers/NWRProvider';
import { TLSProvider } from '../../infrastructure/providers/TLSProvider';
import { DeliveryService } from '../../domain/services/deliveryService';

export default async function deliveryRoutes(fastify: FastifyInstance) {
    fastify.post('/', async (request, reply) => {
        try {
            const body = request.body as { 
                orderId?: string;
                pickup?: {
                    lat: number;
                    lng: number;
                };
                dropoff?: {
                    lat: number;
                    lng: number;
                };
                description?: string;
                customerAddress?: {
                    street: string;
                    city: string;
                    postalCode: string;
                    country: string;
                };
                weight?: number;
                dimensions?: {
                    length: number;
                    width: number;
                    height: number;
                };
            };
            const orderId = body?.orderId || `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            console.log(`📨 Received delivery request for order: ${orderId}`);
            
            const providers = {
                NRW: new NRWProvider(),
                TLS: new TLSProvider()
            };
            
            const deliveryRepoInstance = new DeliveryRepository();
            const createDeliveryUseCase = new CreateDelivery(deliveryRepoInstance, providers);
            
            // Execute delivery creation with actual label generation
            const result = await createDeliveryUseCase.execute(orderId);
            
            reply.status(201).send(result);
        } catch (error) {
            console.error('❌ Error creating delivery:', error);
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // Handle specific provider errors
            if (errorMessage.includes('Label generation failed')) {
                reply.status(503).send({ 
                    success: false,
                    error: 'Service temporarily unavailable',
                    details: errorMessage,
                    code: 'PROVIDER_ERROR'
                });
            } else {
                reply.status(500).send({ 
                    success: false,
                    error: 'Internal server error',
                    details: errorMessage
                });
            }
        }
    });
    
    fastify.get('/:id/status', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            if (!id) {
                reply.status(400).send({ 
                    success: false,
                    error: 'Delivery ID is required' 
                });
                return;
            }
            
            const deliveryRepoInstance = new DeliveryRepository();
            const delivery = await deliveryRepoInstance.findById(id);
            
            if (!delivery) {
                reply.status(404).send({ 
                    success: false,
                    error: 'Delivery not found' 
                });
                return;
            }

            // Use domain service for enhanced status information
            const providers = {
                NRW: new NRWProvider(),
                TLS: new TLSProvider()
            };
            const deliveryService = new DeliveryService(deliveryRepoInstance, providers);
            
            reply.send({ 
                success: true,
                data: {
                    id: delivery.id,
                    status: delivery.status,
                    statusDescription: deliveryService.getStatusDescription(delivery.status),
                    orderId: delivery.orderId,
                    provider: delivery.provider,
                    trackingId: delivery.trackingId,
                    labelUrl: delivery.labelUrl,
                    estimatedDelivery: delivery.estimatedDelivery,
                    createdAt: delivery.createdAt,
                    updatedAt: delivery.updatedAt
                }
            });
        } catch (error) {
            console.error('❌ Error fetching delivery status:', error);
            reply.status(500).send({ 
                success: false,
                error: 'Internal server error' 
            });
        }
    });
}