# MRU ERP Backend

Production-ready backend API for the MRU ERP system built with Express, Prisma, and Redis.

## 🚀 Features

- **Express.js** REST API
- **Prisma ORM** for database management
- **PostgreSQL** database
- **Redis** for caching and sessions
- **WebSocket** support via Socket.io
- **JWT** authentication
- **TypeScript** for type safety
- **Attendance Management** system
- **User Management** (Students, Teachers, Admin)

## 📁 Project Structure

```
apps/backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── src/
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client instance
│   │   └── redis.ts       # Redis client instance
│   ├── controllers/       # Route controllers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middlewares/       # Custom middleware
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── index.ts           # App entry point
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json
├── Dockerfile
├── DEPLOYMENT.md          # Detailed deployment guide
└── QUICK_DEPLOY.md        # Quick deployment commands
```

## 🛠️ Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **PostgreSQL** database
- **Redis** server
- **npm** or **bun** package manager

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
# or
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mru_erp"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
```

### 3. Generate Prisma Client

```bash
bun run prisma:generate
# or
npm run prisma:generate
```

### 4. Run Migrations

```bash
bun run prisma:migrate:dev
# or
npm run prisma:migrate:dev
```

### 5. Start Development Server

```bash
bun run dev
# or
npm run dev
```

The server will start at `http://localhost:4000`

## 📝 Available Scripts

| Script                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| `bun run dev`                | Start development server with hot reload |
| `bun run build`              | Build for production                     |
| `bun start`                  | Start production server                  |
| `bun run prisma:generate`    | Generate Prisma Client                   |
| `bun run prisma:migrate`     | Apply migrations (production)            |
| `bun run prisma:migrate:dev` | Create & apply migrations (development)  |
| `bun run prisma:studio`      | Open Prisma Studio (database GUI)        |

## 🌐 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Users

- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile

### Students

- `GET /api/v1/student/dashboard` - Student dashboard data
- `GET /api/v1/student/timetable` - Student timetable
- `GET /api/v1/student/attendance` - Student attendance records

### Teachers

- `GET /api/v1/teacher/dashboard` - Teacher dashboard data
- `GET /api/v1/teacher/courses` - Teacher's courses
- `GET /api/v1/teacher/schedule` - Teacher's schedule

### Attendance

- `POST /api/v1/attendance/session` - Create attendance session
- `PUT /api/v1/attendance/record` - Mark attendance
- `GET /api/v1/attendance/report` - Get attendance reports

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Or via cookies (automatic in browser).

## 🗄️ Database

The application uses PostgreSQL with Prisma ORM. The schema includes:

- Users (Students, Teachers, Admins)
- Departments & Programs
- Batches & Sections
- Groups
- Courses & Components
- Class Schedules
- Attendance Sessions & Records

### Database Commands

```bash
# View database in browser
bun run prisma:studio

# Create a new migration
bun run prisma:migrate:dev --name your_migration_name

# Reset database (development only!)
bunx prisma migrate reset
```

## 🚀 Production Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

For quick deployment commands, see [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

### Quick Production Build

```bash
# Install dependencies
bun install

# Generate Prisma Client
bun run prisma:generate

# Run migrations
bun run prisma:migrate

# Build application
bun run build

# Start production server
bun start
```

### Docker Deployment

```bash
# Build image
docker build -t mru-erp-backend .

# Run container
docker run -p 4000:4000 --env-file .env mru-erp-backend
```

## 🔧 Configuration

### Environment Variables

| Variable         | Description                          | Required           |
| ---------------- | ------------------------------------ | ------------------ |
| `DATABASE_URL`   | PostgreSQL connection string         | Yes                |
| `REDIS_URL`      | Redis connection string              | Yes                |
| `JWT_SECRET`     | Secret key for JWT signing           | Yes                |
| `JWT_EXPIRES_IN` | JWT expiration time                  | No (default: 7d)   |
| `PORT`           | Server port                          | No (default: 4000) |
| `NODE_ENV`       | Environment (development/production) | No                 |

## 📊 Monitoring

Health check endpoints:

- `GET /` - Basic health check
- `GET /api/test` - API test endpoint

## 🧪 Testing

```bash
# Run tests (when available)
bun test

# Run specific test file
bun test path/to/test.ts
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Private - MRU ERP System

## 🆘 Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
bun run prisma:generate
```

### "Database connection error"

- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists

### "Redis connection error"

- Check REDIS_URL in .env
- Ensure Redis server is running

### Build fails

```bash
# Clean install
rm -rf node_modules
bun install
bun run prisma:generate
bun run build
```

## 📞 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ for MRU**
