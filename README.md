# Kiara Medicals

Multi-branch medical store management system with inventory tracking, GST invoicing, and centralized admin analytics.

## Tech Stack
- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** Prisma ORM, MySQL/SQLite

## Getting Started

### 1. Clone & Install
Clone the repository and install dependencies for the workspaces:
```bash
git clone <your-repository-url>
cd Kiara_Medicals
npm install
```

### 2. Environment Setup
Create your environment file:
```bash
cp .env.example .env
```
*(Ensure you update the `.env` file with your actual database connection strings and secrets.)*

### 3. Database Initialization
Generate the Prisma client and apply migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Run Development Server
Start both the client and server concurrently:
```bash
npm run dev
```
*(Server and Client can also be run separately using `npm run dev:server` and `npm run dev:client`)*

## Production Deployment

1. Build the frontend client:
   ```bash
   npm run build
   ```
2. Start the application with PM2:
   ```bash
   pm2 start ecosystem.config.cjs
   ```
3. Backup Database (Optional):
   ```bash
   npm run backup
   ```
