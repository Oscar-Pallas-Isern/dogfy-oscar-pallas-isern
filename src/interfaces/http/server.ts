import Fastify from 'fastify';
import deliveryRoutes from './routes';
import webhookRoutes from '../../infrastructure/webhooks/TLSWebhookHandler';

export async function buildServer() {
  const fastify = Fastify({ logger: true });

  // Register routes
  fastify.register(deliveryRoutes, { prefix: '/deliveries' });
  fastify.register(webhookRoutes, { prefix: '/webhook' });

  return fastify;
}
