import { Delivery, DeliveryStatus } from '../../domain/models/deliveryModel';
import { DeliveryRepositoryPort } from '../../domain/ports/deliveryRepositoryPort';
import { DeliveryModel, DeliveryDocument } from '../database/models/DeliverySchema';
import { DatabaseConnection } from '../database/connection';

export default class MongoDeliveryRepository implements DeliveryRepositoryPort {
  private async ensureConnection() {
    const db = DatabaseConnection.getInstance();
    await db.connect();
  }

  private mapDocumentToDelivery(doc: DeliveryDocument): Delivery {
    return {
      id: doc.id,
      orderId: doc.orderId,
      provider: doc.provider,
      labelUrl: doc.labelUrl,
      trackingId: doc.trackingId,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async create(delivery: Delivery): Promise<Delivery> {
    await this.ensureConnection();
    
    try {
      const deliveryDoc = new DeliveryModel({
        id: delivery.id,
        orderId: delivery.orderId,
        provider: delivery.provider,
        labelUrl: delivery.labelUrl,
        trackingId: delivery.trackingId,
        status: delivery.status,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
      });

      const savedDoc = await deliveryDoc.save();
      return this.mapDocumentToDelivery(savedDoc);
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw new Error('Failed to create delivery');
    }
  }

  public async updateStatus(id: string, status: DeliveryStatus): Promise<void> {
    await this.ensureConnection();
    
    try {
      const result = await DeliveryModel.findOneAndUpdate(
        { id },
        { 
          status, 
          updatedAt: new Date() 
        },
        { new: true }
      );

      if (!result) {
        throw new Error(`Delivery with id ${id} not found`);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw new Error('Failed to update delivery status');
    }
  }

  public async findById(id: string): Promise<Delivery | null> {
    await this.ensureConnection();
    
    try {
      const doc = await DeliveryModel.findOne({ id }).exec();
      return doc ? this.mapDocumentToDelivery(doc) : null;
    } catch (error) {
      console.error('Error finding delivery by id:', error);
      throw new Error('Failed to find delivery');
    }
  }

  public async findByProvider(provider: string): Promise<Delivery[]> {
    await this.ensureConnection();
    
    try {
      const docs = await DeliveryModel.find({ provider }).exec();
      return docs.map(doc => this.mapDocumentToDelivery(doc));
    } catch (error) {
      console.error('Error finding deliveries by provider:', error);
      throw new Error('Failed to find deliveries by provider');
    }
  }
  
  public async findByProviderAndTrackingId(provider: string, trackingId: string): Promise<Delivery | null> {
    await this.ensureConnection();
    
    try {
      const doc = await DeliveryModel.findOne({ provider, trackingId }).exec();
      return doc ? this.mapDocumentToDelivery(doc) : null;
    } catch (error) {
      console.error('Error finding delivery by provider and tracking id:', error);
      throw new Error('Failed to find delivery by provider and tracking id');
    }
  }
}