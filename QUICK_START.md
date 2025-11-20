# Quick Start Guide

Get the Drone Delivery Management Backend up and running in minutes.

## Prerequisites Check

Ensure you have the following installed:

```bash
# Check Node.js version (should be >= 22)
node --version

# Check PostgreSQL (should be >= 17)
psql --version

# Check npm version
npm --version
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL and EMQX (MQTT Broker) with Docker (Recommended)

```bash
docker-compose up -d
```

This starts both PostgreSQL database and EMQX MQTT broker. Or use your local installations.

### 3. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your settings (defaults should work with Docker setup).

📖 **For detailed environment configuration**, see [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)

### 4. Run Database Migrations

The application uses TypeORM with auto-synchronization in development mode, so migrations will run automatically on first start.

### 5. Start the Application

```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

## Verify Installation

### 1. Check Health Endpoint

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T15:00:00.000Z",
  "uptime": 1.234,
  "environment": "development"
}
```

### 2. Access Swagger Documentation

Open your browser and visit:
```
http://localhost:3000/api/docs
```

## Quick Test

### 1. Create an End User Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_user",
    "type": "enduser"
  }'
```

Save the `accessToken` from the response.

### 2. Create an Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "address": "123 Market St, San Francisco"
    },
    "destination": {
      "latitude": 37.8044,
      "longitude": -122.2712,
      "address": "456 Broadway, Oakland"
    },
    "packageDetails": {
      "weight": 2.5,
      "length": 30,
      "width": 20,
      "height": 15,
      "fragile": false,
      "description": "Test package"
    }
  }'
```

### 3. Create Admin Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin_user",
    "type": "admin"
  }'
```

### 4. Check Orders (Admin)

```bash
curl -X GET "http://localhost:3000/api/v1/admin/orders?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Development Workflow

### Start Development Server

```bash
npm run start:dev
```

The server will automatically reload on file changes.

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Format Code

```bash
npm run format
```

### Lint Code

```bash
npm run lint
```

## Database Management

### Access PostgreSQL via Docker

```bash
docker exec -it drone-delivery-postgres psql -U postgres -d drone_delivery
```

### Access pgAdmin (if running)

Open your browser:
```
http://localhost:5050
```

Login:
- Email: `admin@admin.com`
- Password: `admin`

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Database Connection Error

Check if PostgreSQL is running:
```bash
docker ps
```

Check database credentials in `.env` match your setup.

### MQTT Connection Error

Check if EMQX is running:
```bash
docker ps | grep emqx
docker logs drone-delivery-emqx
```

Access EMQX Dashboard:
```bash
# Open in browser
open http://localhost:18083
# Default credentials: admin/public
```

Test EMQX API:
```bash
curl http://localhost:8888/api/v5/nodes
```

### JWT Token Expired

Tokens expire after 15 minutes. Either:
1. Get a new token via `/api/v1/auth/token`
2. Use refresh token via `/api/v1/auth/refresh`

## Next Steps

- Read the [README.md](./README.md) for complete documentation
- Check [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) for environment variable details
- Review [EMQX_SETUP.md](./EMQX_SETUP.md) for MQTT broker configuration
- Import [Postman Collection](./POSTMAN_GUIDE.md) for easy API testing
- Check [API_EXAMPLES.md](./API_EXAMPLES.md) for API usage examples
- Explore the Swagger UI at `http://localhost:3000/api/docs`
- Review the code structure in `/src` directory

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Generate strong secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
3. Set `DB_SYNCHRONIZE=false` (⚠️ **CRITICAL**: never auto-sync in production)
4. Set up proper database migrations
5. Configure MQTT authentication (`MQTT_USERNAME`, `MQTT_PASSWORD`)
6. Configure HTTPS/TLS
7. Set up monitoring and logging
8. Configure rate limiting
9. Set up backup strategies
10. Restrict CORS origins to your actual domains

📖 **For detailed production configuration**, see [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md#production)

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## Support

If you encounter issues:
1. Check the logs in the console
2. Verify environment variables
3. Ensure PostgreSQL is running
4. Check database connection settings
5. Review the error response format in API_EXAMPLES.md

