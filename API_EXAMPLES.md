# API Examples

This document provides practical examples for using the Drone Delivery Management API.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication Flow

### 1. Get Access Token

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_doe",
    "type": "enduser"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessTokenExpiresIn": 900,
  "refreshTokenExpiresIn": 604800,
  "tokenType": "Bearer",
  "userType": "enduser"
}
```

### 2. Refresh Access Token

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### 3. Revoke Token (Logout)

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## End User Operations

### Submit Order

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "address": "123 Market St, San Francisco, CA"
    },
    "destination": {
      "latitude": 37.8044,
      "longitude": -122.2712,
      "address": "456 Broadway, Oakland, CA"
    },
    "packageDetails": {
      "weight": 2.5,
      "length": 30,
      "width": 20,
      "height": 15,
      "fragile": true,
      "description": "Electronics package"
    }
  }'
```

**Response:**
```json
{
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "origin": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "123 Market St, San Francisco, CA"
  },
  "destination": {
    "latitude": 37.8044,
    "longitude": -122.2712,
    "address": "456 Broadway, Oakland, CA"
  },
  "estimatedPickupTime": "2025-11-19T15:30:00.000Z",
  "estimatedDeliveryTime": "2025-11-19T16:15:00.000Z",
  "cost": 15.99
}
```

### Track Order

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/orders/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Cancel Order

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/orders/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "orderId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "cancelled",
  "refundAmount": 15.99,
  "cancelledAt": "2025-11-19T15:45:00.000Z"
}
```

## Drone Operations

### Reserve Job

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/drones/jobs/reserve \
  -H "Authorization: Bearer YOUR_DRONE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone-001",
    "capabilities": ["standard", "fragile"]
  }'
```

**Response:**
```json
{
  "jobId": "job-123",
  "orderId": "order-456",
  "pickupLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "123 Market St"
  },
  "type": "delivery"
}
```

### Grab Order

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/drones/orders/grab \
  -H "Authorization: Bearer YOUR_DRONE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-456",
    "droneId": "drone-001",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }'
```

### Send Heartbeat

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/drones/heartbeat \
  -H "Authorization: Bearer YOUR_DRONE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone-001",
    "location": {
      "latitude": 37.7880,
      "longitude": -122.4070,
      "altitude": 150
    },
    "batteryLevel": 85,
    "speed": 45
  }'
```

**Response:**
```json
{
  "status": "in_transit",
  "currentJob": {
    "orderId": "order-456",
    "destination": {
      "latitude": 37.8044,
      "longitude": -122.2712
    },
    "eta": "2025-11-19T16:15:00.000Z"
  }
}
```

### Mark Order Delivered

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/drones/orders/order-456/status \
  -H "Authorization: Bearer YOUR_DRONE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone-001",
    "status": "delivered",
    "location": {
      "latitude": 37.8044,
      "longitude": -122.2712
    },
    "notes": "Delivered to reception"
  }'
```

### Report Broken

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/drones/report-broken \
  -H "Authorization: Bearer YOUR_DRONE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "droneId": "drone-001",
    "location": {
      "latitude": 37.7950,
      "longitude": -122.3900,
      "altitude": 50
    },
    "issue": "Motor malfunction detected",
    "severity": "high"
  }'
```

**Response:**
```json
{
  "droneId": "drone-001",
  "status": "broken",
  "rescueJobId": "rescue-job-789",
  "message": "Drone marked as broken. Rescue job created."
}
```

## Admin Operations

### Get Orders with Filters

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/orders?status=in_transit&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Modify Order Route

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/orders/order-456 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": {
      "latitude": 37.8100,
      "longitude": -122.2800,
      "address": "789 New Address, Oakland, CA"
    },
    "reason": "Customer requested address change"
  }'
```

### Get Drone Fleet Status

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/drones?status=operational&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "drones": [
    {
      "droneId": "drone-001",
      "model": "DX-200",
      "status": "operational",
      "currentLocation": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "batteryLevel": 95,
      "currentOrder": null,
      "lastHeartbeat": "2025-11-19T15:50:00.000Z",
      "totalDeliveries": 42,
      "totalFlightTime": 127.5
    }
  ],
  "total": 25,
  "summary": {
    "operational": 20,
    "broken": 2,
    "inTransit": 3,
    "idle": 17
  }
}
```

### Update Drone Status

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/admin/drones/drone-001/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "operational",
    "reason": "Maintenance completed - motor replaced"
  }'
```

## Health Check

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T15:00:00.000Z",
  "uptime": 3600.5,
  "environment": "development"
}
```

## Error Response Format

All errors follow this standard format:

```json
{
  "error": {
    "code": "ORDER_001",
    "message": "Order not found",
    "timestamp": "2025-11-19T15:00:00.000Z",
    "requestId": "req-uuid-here"
  }
}
```

## Common Error Codes

- `AUTH_001` - Invalid or expired access token
- `AUTH_002` - Insufficient permissions
- `AUTH_003` - Invalid or expired refresh token
- `AUTH_004` - Refresh token already used (replay attack)
- `AUTH_005` - Refresh token revoked
- `DRONE_001` - Drone not found
- `DRONE_002` - Drone already assigned to job
- `ORDER_001` - Order not found
- `ORDER_002` - Order cannot be cancelled
- `ORDER_003` - Order outside service area
- `VALIDATION_001` - Invalid input format

