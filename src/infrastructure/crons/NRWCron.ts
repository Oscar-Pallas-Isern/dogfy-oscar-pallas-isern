import cron from 'node-cron';
import MongoDeliveryRepository from '../repositories/MongoDeliveryRepository';
import { NRWProvider } from '../providers/NWRProvider';
import { DeliveryService } from '../../domain/services/deliveryService';

const mongoRepository = new MongoDeliveryRepository();
const nrwProvider = new NRWProvider();
const deliveryService = new DeliveryService(mongoRepository, { NRW: nrwProvider, TLS: {} as any }); // TLS not needed for NRW cron

cron.schedule('0 * * * *', async () => {
  console.log('⏰ Starting NRW status polling job...');
  
  try {
    const deliveries = await mongoRepository.findByProvider('NRW');
    console.log(`📦 Found ${deliveries.length} NRW deliveries to check`);
    
    let updatedCount = 0;
    
    for (const delivery of deliveries) {
      try {
        if (delivery.status === 'DELIVERED' || delivery.status === 'FAILED') {
          continue;
        }
        
        const currentStatus = delivery.status;
        const newStatus = await nrwProvider.getStatus(delivery.trackingId);
        
        if (newStatus !== currentStatus) {
          // Validate status transition using domain service
          if (deliveryService.isStatusUpdateAllowed(delivery, newStatus)) {
            await mongoRepository.updateStatus(delivery.id, newStatus);
            console.log(`✅ Updated ${delivery.trackingId}: ${currentStatus} → ${newStatus}`);
            console.log(`📊 Status description: ${deliveryService.getStatusDescription(newStatus)}`);
            updatedCount++;
          } else {
            console.log(`❌ Invalid status transition for ${delivery.trackingId}: ${currentStatus} → ${newStatus}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error updating delivery ${delivery.trackingId}:`, error);
      }
    }
    
    console.log(`🎯 NRW polling completed. Updated ${updatedCount} deliveries.`);
  } catch (error) {
    console.error('❌ NRW cron job failed:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

console.log('🚀 NRW polling cron job initialized (runs every hour)');
