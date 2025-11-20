# Complete Testing Guide - All Flows

This guide walks you through testing **every feature** of the Drone Delivery Management System.

## 🎉 NEW FEATURE: Automatic Drone Assignment

**Drones are now automatically assigned when orders are submitted!**

- ✅ No manual "Reserve Job" step needed
- ✅ Instant assignment to available drones
- ✅ Smart selection based on battery and workload
- ✅ Faster order processing

See [AUTO_ASSIGNMENT_FEATURE.md](./AUTO_ASSIGNMENT_FEATURE.md) for details.

## 📋 Prerequisites

### 1. Setup

```bash
# Clone and install (if not done)
cd drone-delivery-management-backend
npm install

# Start services
docker-compose up -d

# Start application
npm run start:dev

# Verify seeding
# You should see: [DroneSeeder] 🎉 Successfully seeded 5 drones
```

### 2. Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `Drone-Delivery-API.postman_collection.json`
4. Select `Drone-Delivery-API.postman_environment.json`
5. Select environment from dropdown (top-right)

### 3. Verify Services

```bash
# Check health
curl http://localhost:3000/api/v1/health

# Expected:
# {"status":"ok","timestamp":"...","uptime":...,"environment":"development"}
```

---

## 🧪 Flow 1: Complete Delivery (Happy Path)

This tests the complete order lifecycle from submission to delivery.

**🎉 NEW:** Drones are now **automatically assigned** when orders are submitted!

### Step 1: Generate End User Token

**Postman:** `Authentication → Generate Token (End User)`

**Or via curl:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"name": "alice_customer", "type": "enduser"}'
```

**Expected Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

✅ **Verify:** Token is auto-saved to `{{accessToken}}` variable in Postman

---

### Step 2: Submit Order

**Postman:** `Orders → Submit Order`

**Request Body:**

```json
{
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
    "fragile": false,
    "description": "Electronics package"
  }
}
```

**Expected Response:**

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "assigned", // 🎉 Already assigned!
  "cost": 15.5,
  "estimatedPickupTime": "2025-11-20T20:45:00.000Z",
  "estimatedDeliveryTime": "2025-11-20T21:15:00.000Z",
  "assignedDrone": {
    // 🎉 Drone automatically assigned!
    "droneId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "model": "DX-200"
  }
}
```

✅ **Verify:**

- `orderId` is auto-saved to `{{orderId}}` variable
- Status is `assigned` (not `pending`!) 🎉
- `assignedDrone` is populated with drone info
- **Drone automatically assigned - no manual "Reserve Job" needed!**

---

### Step 3: Track Order (Verify Assignment)

**Postman:** `Orders → Track Order`

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "assigned",  // 🎉 Already assigned!
  "origin": {...},
  "destination": {...},
  "assignedDrone": {     // Drone info included
    "droneId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "model": "DX-200"
  },
  "createdAt": "..."
}
```

✅ **Verify:** Drone was automatically assigned when order was created!

---

### Step 4: Get Drone Info (Optional - Admin Check)

Get admin token and check drone status:

**Postman:** `Authentication → Generate Token (Admin)`

```json
{ "name": "admin_ops", "type": "admin" }
```

**Postman:** `Admin → Get Drone Fleet Status`

**Expected Response:**

```json
{
  "drones": [
    {
      "droneId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "model": "DX-200",
      "status": "in_transit",  // 🎉 Already assigned to order!
      "currentOrder": "550e8400-...",
      "batteryLevel": 100,
      "currentLocation": {...}
    },
    // ... 4 more drones
  ]
}
```

✅ **Verify:**

- Assigned drone's status is `in_transit`
- Drone's `currentOrder` matches your order ID
- ✅ **Action:** Copy the assigned drone's `droneId` to Postman variable `{{droneId}}`

---

### Step 5: ~~Reserve Job~~ (NOT NEEDED ANYMORE! 🎉)

**This step is now automatic!** The drone is already assigned when the order is created.

~~Drones no longer need to call "Reserve Job" for regular orders.~~

---

### Step 6: Track Order (Verify Assignment)

**Postman:** `Orders → Track Order` (as end user)

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "assigned", // Still assigned
  "assignedDrone": {
    "droneId": "f47ac10b-...",
    "model": "DX-200"
  }
}
```

✅ **Verify:** Order is assigned and ready for pickup

---

### Step 7: Generate Drone Token

**Postman:** `Authentication → Generate Token (Drone)`

**Request Body:**

```json
{
  "name": "delivery_drone_1",
  "type": "drone"
}
```

✅ **Verify:** Switched to drone token

---

### Step 8: Grab Order (Pickup)

**Postman:** `Drones → Grab Order (Pickup)`

**Request Body:**

```json
{
  "droneId": "{{droneId}}",
  "orderId": "{{orderId}}",
  "location": {
    "latitude": 37.7749, // Must match pickup location!
    "longitude": -122.4194,
    "altitude": 50
  }
}
```

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "picked_up",
  "message": "Order picked up successfully",
  "destination": {...}
}
```

✅ **Verify:**

- Status changed to `picked_up`
- Package is now with drone

---

### Step 9: Send Heartbeats via MQTT

During transit, drone sends heartbeats via MQTT.

**Option A: Using mosquitto_pub (Terminal)**

```bash
# Open terminal and subscribe to acknowledgments
mosquitto_sub -h localhost -p 1883 -t 'drones/+/heartbeat/ack' -v

# Open another terminal and publish heartbeat
mosquitto_pub -h localhost -p 1883 \
  -t "drones/{{droneId}}/heartbeat" \
  -m '{
    "droneId": "{{droneId}}",
    "location": {"lat": 37.7880, "lon": -122.4070, "alt": 150},
    "battery": 85,
    "speed": 45,
    "timestamp": 1700408400000
  }'
```

**Option B: Using EMQX Dashboard**

1. Open http://localhost:18083 (admin/public)
2. Go to **WebSocket Client**
3. Connect to `ws://localhost:8083/mqtt`
4. Subscribe to: `drones/+/heartbeat/ack`
5. Publish to: `drones/{{droneId}}/heartbeat`
6. Payload: See above JSON

**Expected:** You'll receive acknowledgment with current job info

✅ **Verify:** Server responds with job details and ETA

---

### Step 10: Track Order (During Transit)

**Postman:** `Orders → Track Order` (as end user)

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "in_transit", // Updated!
  "assignedDrone": {
    "currentLocation": {
      "latitude": 37.788, // Updated from heartbeat!
      "longitude": -122.407
    }
  }
}
```

✅ **Verify:** Real-time location from MQTT heartbeats

---

### Step 11: Mark Delivered

**Postman:** `Drones → Update Order Status (Delivered)` (as drone)

**Request Body:**

```json
{
  "droneId": "{{droneId}}",
  "status": "delivered",
  "location": {
    "latitude": 37.8044, // Must match destination!
    "longitude": -122.2712,
    "altitude": 0
  }
}
```

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "delivered",
  "message": "Order delivered successfully",
  "completedAt": "2025-11-20T21:15:00.000Z"
}
```

✅ **Verify:**

- Status is `delivered`
- Delivery confirmed

---

### Step 12: Verify Completion

**Postman:** `Orders → Track Order` (as end user)

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "delivered",
  "completedAt": "2025-11-20T21:15:00.000Z"
}
```

✅ **Flow Complete!** Order successfully delivered from start to finish.

---

## 🚨 Flow 2: Broken Drone Recovery

This tests the rescue mission feature when a drone breaks down.

### Step 1-8: Same as Flow 1

Complete steps 1-8 from Flow 1 (Submit order, reserve job, pickup package)

---

### Step 9: Drone Reports Malfunction

**Postman:** `Drones → Report Broken` (as drone)

**Request Body:**

```json
{
  "droneId": "{{droneId}}",
  "location": {
    "latitude": 37.79, // Where drone broke down
    "longitude": -122.41,
    "altitude": 0
  },
  "issue": "Motor failure - unable to continue flight",
  "severity": "high"
}
```

**Expected Response:**

```json
{
  "droneId": "...",
  "status": "broken",
  "rescueJobCreated": true,
  "rescueJobId": "rescue-job-uuid",
  "message": "Rescue job created for order..."
}
```

✅ **Verify:**

- Drone marked as `broken`
- Rescue job automatically created
- Order status changes to `awaiting_rescue`

---

### Step 10: Check Order Status

**Postman:** `Orders → Track Order` (as end user)

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "awaiting_rescue", // Waiting for rescue!
  "assignedDrone": null
}
```

---

### Step 11: Second Drone Gets Admin Token

**Postman:** `Authentication → Generate Token (Admin)`

**Postman:** `Admin → Get Drone Fleet Status`

✅ **Find another drone** (not the broken one) and copy its UUID
✅ **Set** `droneId` variable to the new drone's UUID

---

### Step 12: Rescue Drone Reserves Job

**Postman:** `Authentication → Generate Token (Drone)`

**Postman:** `Drones → Reserve Job`

**Request Body:**

```json
{
  "droneId": "{{droneId}}", // Different drone!
  "capabilities": ["standard"]
}
```

**Expected Response:**

```json
{
  "jobId": "rescue-job-uuid",
  "orderId": "...", // Same order
  "pickupLocation": {
    "latitude": 37.79, // Broken drone's location!
    "longitude": -122.41
  },
  "type": "rescue" // Not "delivery"!
}
```

✅ **Verify:**

- Got RESCUE job (not regular delivery)
- Pickup location is where broken drone stopped
- Job has HIGH priority

---

### Step 13: Rescue Drone Picks Up Package

**Postman:** `Drones → Grab Order (Pickup)`

**Request Body:**

```json
{
  "droneId": "{{droneId}}",
  "orderId": "{{orderId}}",
  "location": {
    "latitude": 37.79, // Broken drone location
    "longitude": -122.41,
    "altitude": 0
  }
}
```

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "picked_up",
  "message": "Order picked up successfully"
}
```

✅ **Verify:** Rescue drone picked up package from broken drone

---

### Step 14: Complete Delivery

**Postman:** `Drones → Update Order Status (Delivered)`

**Request Body:**

```json
{
  "droneId": "{{droneId}}",
  "status": "delivered",
  "location": {
    "latitude": 37.8044, // Original destination
    "longitude": -122.2712,
    "altitude": 0
  }
}
```

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "delivered",
  "message": "Order delivered successfully"
}
```

✅ **Flow Complete!** Package rescued and delivered despite drone failure.

---

## 👨‍💼 Flow 3: Admin Fleet Management

This tests all admin operations.

### Step 1: Get Admin Token

**Postman:** `Authentication → Generate Token (Admin)`

```json
{ "name": "admin_ops", "type": "admin" }
```

---

### Step 2: View All Orders

**Postman:** `Admin → Get Orders (Bulk)`

**Query Parameters:**

- `status`: `in_transit` (or leave empty for all)
- `limit`: `20`
- `offset`: `0`

**Expected Response:**

```json
{
  "orders": [
    {
      "orderId": "...",
      "userId": "...",
      "status": "in_transit",
      "origin": {...},
      "destination": {...},
      "assignedDrone": "drone-uuid",
      "createdAt": "..."
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

✅ **Verify:** Can see all orders with filters

---

### Step 3: View Fleet Status

**Postman:** `Admin → Get Drone Fleet Status`

**Expected Response:**

```json
{
  "drones": [
    {
      "droneId": "...",
      "model": "DX-200",
      "status": "operational",
      "batteryLevel": 85,
      "currentLocation": {...},
      "currentOrder": "order-uuid",
      "lastHeartbeat": "2025-11-20T21:00:00.000Z"
    }
  ],
  "total": 5,
  "summary": {
    "operational": 3,
    "broken": 1,
    "inTransit": 1,
    "idle": 0
  }
}
```

✅ **Verify:** Can see entire fleet and statistics

---

### Step 4: Modify Order Route

**Postman:** `Admin → Modify Order Route`

**Request Body:**

```json
{
  "destination": {
    "latitude": 37.81, // New destination
    "longitude": -122.28,
    "address": "789 New Address, Oakland, CA"
  },
  "reason": "Customer requested address change"
}
```

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "in_transit",
  "destination": {
    "latitude": 37.81,
    "longitude": -122.28
  },
  "newEta": "2025-11-20T21:25:00.000Z", // Recalculated!
  "modifiedBy": "admin_ops"
}
```

✅ **Verify:**

- Destination updated
- ETA recalculated
- Change logged

---

### Step 5: Fix Broken Drone

**Postman:** `Admin → Update Drone Status`

**Request Body:**

```json
{
  "status": "operational",
  "reason": "Maintenance completed - motor replaced"
}
```

**Expected Response:**

```json
{
  "droneId": "...",
  "previousStatus": "broken",
  "newStatus": "idle", // Now available!
  "updatedAt": "2025-11-20T21:30:00.000Z",
  "updatedBy": "admin_ops"
}
```

✅ **Verify:**

- Drone status changed
- Breakage events resolved
- Drone available for new jobs

---

### Step 6: Create New Drone

**Postman:** `Admin → Create Drone`

**Request Body:**

```json
{
  "model": "CustomDrone-X5",
  "currentLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "San Francisco HQ"
  },
  "homeBase": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "San Francisco HQ"
  },
  "batteryLevel": 100,
  "capabilities": ["standard", "express"],
  "maxPayload": 12.0,
  "maxRange": 65.0
}
```

**Expected Response:**

```json
{
  "id": "new-uuid-...", // Auto-generated
  "model": "CustomDrone-X5",
  "status": "idle",
  "batteryLevel": 100,
  "capabilities": ["standard", "express"],
  "totalDeliveries": 0,
  "createdAt": "2025-11-20T21:35:00.000Z"
}
```

✅ **Verify:** New drone created with UUID

---

### Step 7: Get Drone Details

**Postman:** `Admin → Get Drone by ID`

Set `droneId` to the new drone's UUID, then:

**Expected Response:**

```json
{
  "id": "...",
  "model": "CustomDrone-X5",
  "status": "idle",
  "currentLocation": {...},
  "homeBase": {...},
  "batteryLevel": 100,
  "capabilities": ["standard", "express"],
  "maxPayload": 12.0,
  "maxRange": 65.0,
  "totalDeliveries": 0,
  "createdAt": "..."
}
```

✅ **Verify:** Can retrieve complete drone details

---

### Step 8: Update Drone

**Postman:** `Admin → Update Drone`

**Request Body:**

```json
{
  "model": "CustomDrone-X5-Enhanced",
  "batteryLevel": 95,
  "capabilities": ["standard", "express", "fragile"]
}
```

**Expected Response:**

```json
{
  "id": "...",
  "model": "CustomDrone-X5-Enhanced", // Updated
  "batteryLevel": 95, // Updated
  "capabilities": ["standard", "express", "fragile"] // Updated
}
```

✅ **Verify:** Only specified fields updated

---

### Step 9: Delete Drone

**Postman:** `Admin → Delete Drone`

**Expected Response:**

```json
{
  "message": "Drone <uuid> deleted successfully"
}
```

✅ **Verify:** Drone removed from system

---

### Step 10: Try to Delete Active Drone

Try to delete a drone that's currently on delivery:

**Expected Response:**

```json
{
  "statusCode": 409,
  "message": "Cannot delete drone that is currently assigned to an order"
}
```

✅ **Verify:** System prevents deletion of active drones

---

## 🔄 Flow 4: Multiple Orders & Job Priority

This tests job prioritization (rescue jobs get priority).

### Step 1: Create 3 Orders

**Postman:** `Orders → Submit Order` (run 3 times with different data)

Order 1:

```json
{
  "origin": { "latitude": 37.7749, "longitude": -122.4194 },
  "destination": { "latitude": 37.8044, "longitude": -122.2712 },
  "packageDetails": { "weight": 2.5, "length": 30, "width": 20, "height": 15 }
}
```

Order 2:

```json
{
  "origin": { "latitude": 37.7749, "longitude": -122.4194 },
  "destination": { "latitude": 37.758, "longitude": -122.412 },
  "packageDetails": { "weight": 3.0, "length": 40, "width": 25, "height": 20 }
}
```

Order 3:

```json
{
  "origin": { "latitude": 37.7749, "longitude": -122.4194 },
  "destination": { "latitude": 37.795, "longitude": -122.394 },
  "packageDetails": { "weight": 1.5, "length": 20, "width": 15, "height": 10 }
}
```

✅ **Result:** 3 orders in `pending` status

---

### Step 2: Drone 1 Takes Order 1

1. Get drone token
2. Reserve job → Gets Order 1
3. Grab order
4. Report broken → Creates RESCUE job (HIGH priority)

---

### Step 3: Drone 2 Reserves Job

**Postman:** `Drones → Reserve Job`

**Expected:** Gets the **RESCUE job**, not Order 2 or 3!

**Response:**

```json
{
  "jobId": "rescue-job-...",
  "orderId": "<Order 1 ID>",
  "type": "rescue" // Not regular delivery
}
```

✅ **Verify:**

- Rescue job has priority over regular deliveries
- Order 2 and 3 still waiting
- Rescue job picked first

---

## 📊 Flow 5: Token Management

### Step 1: Test Token Expiration

Tokens expire after 15 minutes. Test refresh:

1. **Generate token** (any type)
2. **Wait 16 minutes** (or manually test after 15 min)
3. **Try any authenticated request** → Get 401 Unauthorized
4. **Postman:** `Authentication → Refresh Token`

**Request Body:**

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Expected Response:**

```json
{
  "accessToken": "new-token...",
  "refreshToken": "new-refresh-token..."
}
```

✅ **Verify:**

- Old token invalid after expiration
- Refresh token gets new tokens
- New tokens work

---

### Step 2: Test Token Revocation

**Postman:** `Authentication → Revoke Token (Logout)`

**Request Body:**

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Expected Response:**

```json
{
  "message": "Token revoked successfully"
}
```

Now try to use the refresh token again → Should fail!

✅ **Verify:**

- Token revoked
- Cannot be reused
- Must generate new token

---

## 🧪 Flow 6: Edge Cases & Error Handling

### Test 1: Wrong Role Access

Try to access admin endpoint as end user:

```
1. Get end user token
2. Try: Admin → Get Drone Fleet Status
3. Expected: 403 Forbidden
```

✅ **Verify:** Role-based access control works

---

### Test 2: Pickup Without Location Match

Try to pickup order from wrong location:

```json
{
  "droneId": "{{droneId}}",
  "orderId": "{{orderId}}",
  "location": {
    "latitude": 99.9999, // Wrong location!
    "longitude": 99.9999
  }
}
```

**Expected:** 400 Bad Request - "Drone not at pickup location"

✅ **Verify:** Location validation works

---

### Test 3: Deliver Without Location Match

Try to deliver to wrong location:

```json
{
  "droneId": "{{droneId}}",
  "status": "delivered",
  "location": {
    "latitude": 99.9999, // Wrong location!
    "longitude": 99.9999
  }
}
```

**Expected:** 400 Bad Request - "Drone not at delivery location"

✅ **Verify:** Delivery location validation works

---

### Test 4: Cancel Order

**Postman:** `Orders → Cancel Order` (as end user)

**Expected Response:**

```json
{
  "orderId": "...",
  "status": "cancelled",
  "message": "Order cancelled successfully"
}
```

✅ **Verify:** End users can cancel their orders

---

### Test 5: No Jobs Available

When all orders are assigned:

**Postman:** `Drones → Reserve Job`

**Expected:** 404 Not Found - "No jobs available"

✅ **Verify:** Graceful handling when no work available

---

## ✅ Complete Testing Checklist

### Order Management

- [ ] Submit order (end user)
- [ ] Track pending order
- [ ] Track assigned order
- [ ] Track order during transit
- [ ] Track delivered order
- [ ] Cancel order

### Drone Operations

- [ ] Reserve job (gets pending order)
- [ ] Pick up order (with location verification)
- [ ] Send MQTT heartbeats
- [ ] Update order status to delivered
- [ ] Report broken
- [ ] Get current order info

### Rescue Operations

- [ ] Drone breaks with package
- [ ] Rescue job created automatically
- [ ] Second drone gets rescue job (priority)
- [ ] Rescue drone completes delivery
- [ ] Original order delivered successfully

### Admin Operations

- [ ] View all orders with filters
- [ ] Modify order route
- [ ] View drone fleet status
- [ ] Update drone status (fix broken drone)
- [ ] Create new drone
- [ ] Get drone by ID
- [ ] Update drone specifications
- [ ] Delete inactive drone
- [ ] Cannot delete active drone

### Authentication & Authorization

- [ ] Generate token (all 3 types)
- [ ] Refresh token
- [ ] Revoke token
- [ ] Role-based access control (403 errors)
- [ ] Token expiration (401 errors)

### MQTT Real-Time

- [ ] Send heartbeat via MQTT
- [ ] Receive acknowledgment
- [ ] Real-time location updates
- [ ] Order tracking shows live location

### Edge Cases

- [ ] Wrong location pickup (rejected)
- [ ] Wrong location delivery (rejected)
- [ ] No jobs available (404)
- [ ] Wrong role access (403)
- [ ] Invalid order ID (404)
- [ ] Invalid drone ID (404)

### Drone CRUD

- [ ] Auto-seeding on startup (5 drones)
- [ ] Create drone with auto UUID
- [ ] Get drone details
- [ ] Update drone
- [ ] Delete drone
- [ ] Seeding skips if drones exist

---

## 🎯 Quick Test Script

For rapid testing, run this sequence:

```bash
# 1. End User Flow (Auto-Assignment! 🎉)
POST /auth/token (enduser) → GET token
POST /orders (create order) → GET orderId + droneId (auto-assigned!)
GET /orders/{orderId} (track) → status: assigned ✅

# 2. Drone Flow (Simplified!)
POST /auth/token (drone) → GET token
POST /drones/orders/grab → pickup (no reserve needed!)
PUT /drones/orders/{orderId}/status → delivered

# 3. Verify
GET /orders/{orderId} → status: delivered ✅

# Steps reduced from 10 to 7! 🎉
```

---

## 📈 Success Criteria

All flows pass if:

- ✅ Orders move through all statuses
- ✅ Drones can reserve and complete jobs
- ✅ Rescue operations work automatically
- ✅ Admin can manage fleet
- ✅ MQTT heartbeats work
- ✅ Role-based access enforced
- ✅ Validation prevents errors
- ✅ Tokens refresh and revoke correctly

---

## 🎉 You're Done!

If you've completed all flows, you've tested:

- **Complete delivery workflow** ✅
- **Broken drone recovery** ✅
- **Admin fleet management** ✅
- **Job prioritization** ✅
- **Token management** ✅
- **MQTT real-time updates** ✅
- **Drone CRUD operations** ✅
- **Error handling** ✅

**System Status:** Fully functional and production-ready! 🚀
