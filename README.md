# Drone Delivery Management Backend

A comprehensive backend system for managing drone-based delivery operations, built with NestJS, TypeScript, and PostgreSQL.

## 🚀 Features

- **JWT Authentication** with secure token rotation strategy
- **Role-Based Access Control** (Admin, End User, Drone)
- **Hybrid Architecture** - REST + MQTT for optimal performance
- **MQTT Real-Time Communication** for drone heartbeats and commands
- **Real-time Order Tracking** via MQTT pub/sub
- **Automatic Job Assignment** with priority-based matching
- **Broken Drone Recovery** with rescue operations
- **Order Lifecycle Management** from creation to delivery
- **Administrative Dashboard** for fleet monitoring
- **RESTful API** with OpenAPI (Swagger) documentation

## 📋 Prerequisites

- Node.js >= 22.0.0
- PostgreSQL >= 17
- EMQX (MQTT Broker) - included in Docker setup
- npm >= 10.0.0
- Docker & Docker Compose (for database and MQTT broker)

## 🛠️ Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd drone-delivery-management-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Configure your `.env` file with the necessary environment variables. See [`.env.example`](./.env.example) for all available options:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=drone_delivery

# JWT Authentication
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_REFRESH_EXPIRATION=7d

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=drone-delivery-backend
```

5. Start PostgreSQL and EMQX (MQTT broker):

```bash
docker-compose up -d
```

6. Create the database (if not using Docker):

```bash
createdb drone_delivery
```

## 🏃 Running the Application

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json
- **EMQX Dashboard**: http://localhost:18083 (default credentials: admin/public)
- **EMQX API**: http://localhost:8888/api/v5
- **EMQX Setup Guide**: See [EMQX_SETUP.md](./EMQX_SETUP.md)
- **Postman Collection**: See [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)

## 🏗️ Architecture

### Hybrid Architecture

The system uses a **hybrid approach**:

- **REST API** for authentication, CRUD operations, and admin functions
- **MQTT** for real-time drone communication and order tracking

This provides:

- Low latency for real-time updates (< 100ms)
- RESTful simplicity for standard operations
- Pub/Sub pattern for efficient 1-to-many communication
- Persistent connections for drones

### Module Structure

```
src/
├── common/              # Shared utilities, guards, filters
│   ├── decorators/      # Custom decorators
│   ├── dto/             # Shared DTOs
│   ├── entities/        # Shared entities
│   ├── enums/           # Enumerations
│   ├── exceptions/      # Custom exceptions
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth & role guards
│   └── utils/           # Utility functions
├── config/              # Configuration files
├── modules/             # Feature modules
│   ├── admin/           # Admin operations
│   ├── auth/            # Authentication & JWT
│   ├── drone/           # Drone operations
│   ├── mqtt/            # MQTT real-time communication
│   ├── order/           # Order management
│   └── user/            # User management
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

### Key Design Principles

- **SOLID Principles**: Single responsibility, open-closed, dependency inversion
- **Clean Code**: Meaningful names, small functions, proper comments
- **Modular Design**: Each module handles a specific business domain
- **Separation of Concerns**: DTOs, entities, services, and controllers are clearly separated

## 🔐 Authentication

The system uses JWT tokens with a secure rotation strategy:

1. **Access Token**: Short-lived (15 minutes) for API authorization
2. **Refresh Token**: Long-lived (7 days) for obtaining new access tokens
3. **Token Rotation**: Each refresh generates a new token pair
4. **Replay Attack Prevention**: Old tokens are invalidated after use

### Getting Tokens

```bash
# Request tokens
POST /api/v1/auth/token
{
  "name": "john_doe",
  "type": "enduser"
}

# Refresh tokens
POST /api/v1/auth/refresh
{
  "refreshToken": "your-refresh-token"
}

# Revoke token (logout)
POST /api/v1/auth/revoke
{
  "refreshToken": "your-refresh-token"
}
```

## 📖 API Endpoints

### Authentication

- `POST /api/v1/auth/token` - Generate tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/revoke` - Revoke token (logout)

### Orders (End Users)

- `POST /api/v1/orders` - Submit new order
- `GET /api/v1/orders/:id` - Track order
- `DELETE /api/v1/orders/:id` - Cancel order

### Drones

- `POST /api/v1/drones/jobs/reserve` - Reserve a job
- `POST /api/v1/drones/orders/grab` - Pick up order
- `PUT /api/v1/drones/orders/:id/status` - Update delivery status
- `POST /api/v1/drones/report-broken` - Report malfunction
- `GET /api/v1/drones/orders/current` - Get current order

**Note**: Drone heartbeats are sent via MQTT (`drones/:droneId/heartbeat`) for real-time performance.

### Admin

- `GET /api/v1/admin/orders` - Get orders with filters
- `PUT /api/v1/admin/orders/:id` - Modify order route
- `GET /api/v1/admin/drones` - Get fleet status
- `PUT /api/v1/admin/drones/:id/status` - Update drone status

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🗄️ Database Schema

### Main Entities

- **Users**: System actors (admin, enduser, drone)
- **RefreshTokens**: Token rotation tracking
- **Orders**: Delivery orders with lifecycle tracking
- **Drones**: Drone fleet with real-time status
- **Jobs**: Job assignments (delivery & rescue)
- **BreakageEvents**: Drone malfunction history
- **OrderModifications**: Admin change audit trail

## 🔄 Business Logic

### Hybrid Communication Flow

**REST is used for:**

- Authentication and token management
- Order submission by customers
- Job reservation by drones
- Order pickup confirmation
- Delivery completion
- Admin operations

**MQTT is used for:**

- Drone heartbeats (every 30 seconds)
- Real-time location updates
- Status change notifications
- Server commands to drones
- Live order tracking for customers

### Order Lifecycle

1. **Pending** - Order created (REST), waiting for assignment
2. **Assigned** - Drone assigned (REST), heading to pickup
3. **Picked Up** - Package collected (REST)
4. **In Transit** - En route (MQTT real-time updates)
5. **Delivered** - Successfully delivered (REST)
6. **Failed** - Delivery failed
7. **Cancelled** - Cancelled by user

### Job Priority

1. **High** - Rescue jobs (broken drone recovery)
2. **Medium** - Regular deliveries
3. **Low** - Non-urgent deliveries

### Broken Drone Handling

1. Drone reports malfunction (via MQTT or REST)
2. System marks drone as broken
3. If carrying order, create rescue job
4. Update order status to "awaiting rescue"
5. Another drone picks up rescue job
6. Package delivered to final destination

## 🛡️ Security Features

- JWT token-based authentication
- Refresh token rotation
- Token replay attack detection
- Role-based access control
- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- Rate limiting (configurable)

## ⚙️ Configuration

Key configuration options in `.env`:

```env
# Application
PORT=3000
NODE_ENV=development
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=drone_delivery
DB_SYNCHRONIZE=true
DB_LOGGING=true

# JWT Authentication
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_REFRESH_EXPIRATION=7d

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=drone-delivery-backend

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

For Docker deployments, update the following:

```env
DB_HOST=postgres
MQTT_BROKER_URL=mqtt://emqx:1883
```

See [`.env.example`](./.env.example) for all available configuration options with detailed descriptions.

## 📊 Performance Targets

- API response time < 200ms (95th percentile)
- Support 1000+ concurrent drone connections
- 99.9% uptime for critical endpoints
- Location updates processed in < 100ms

## 🚧 Development

### Code Style

```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 📝 License

MIT

## 👥 Authors

Ahmed Hatem

## 🤝 Contributing

1. Follow SOLID principles and clean code practices
2. Write meaningful comments (as a human, not AI)
3. Ensure all tests pass
4. Update documentation
5. Submit pull request

## 📞 Support

For issues and questions, please create an issue in the repository.
