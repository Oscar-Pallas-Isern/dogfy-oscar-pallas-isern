# DogfyDiet - Logistics Microservice

TypeScript/Node.js microservice for managing deliveries across multiple shipping providers using Hexagonal Architecture.

## Quick Start

You will need Docker Desktop to deploy the app

```bash
git clone https://github.com/Oscar-Pallas-Isern/dogfy-oscar-pallas-isern.git
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
```

### Get Status
```http
GET /deliveries/{id}/status
```

### TLS Webhook
```http
POST /webhooks/tls
Content-Type: application/json
```
### NRW Cron
To test the cron without wait 1 hour you can change the cron from '0 * * * *' to '* * * * *' in
src/infrastructure/crons/NRWCron.ts line 10

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
