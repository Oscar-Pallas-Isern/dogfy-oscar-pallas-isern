# DogfyDiet - Logistics Microservice

TypeScript/Node.js microservice for managing deliveries across multiple shipping providers using Hexagonal Architecture.

## Quick Start

You will need Docker Desktop to deploy the app

```bash
git clone <repository-url>
cd dogfydiet
npm i
npm run build
npm run start:dev
```

API available at `http://localhost:3000`

## API Endpoints

### Create Delivery
```http
POST /deliveries
Content-Type: application/json

{
  "pickup": {"lat": 40.7128, "lng": -74.0060},
  "dropoff": {"lat": 40.7589, "lng": -73.9851},
  "description": "Test delivery"
}
```

### Get Status
```http
GET /deliveries/{id}/status
```

### TLS Webhook
```http
POST /webhooks/tls
Content-Type: application/json

{
  "trackingId": "TLS987654321",
  "status": "delivered",
  "timestamp": "2025-08-04T14:45:00Z"
}
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Start with Docker (rebuild) |
| `npm run start:docker` | Start with Docker |
| `npm start` | Start compiled app |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run stop` | Stop containers |
| `npm run restart` | Restart containers |
