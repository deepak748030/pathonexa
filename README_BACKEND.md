# PathoNexa Production Backend Integration

This project now includes a production-grade Node.js/Express/MongoDB backend located in the `server/` folder.

## Setup Instructions

### 1. Database (MongoDB Atlas)
- Create a free cluster at [mongodb.com](https://www.mongodb.com/cloud/atlas).
- Get your connection string (MONGODB_URI).
- Add your current IP address to the whitelist in Network Access.

### 2. Server Configuration
- Navigate to the `server/` directory.
- Rename `.env.example` to `.env`.
- Fill in your `MONGODB_URI` and a secure `JWT_SECRET`.

### 3. Local Testing
- Run `npm install` in the `server/` folder.
- Run `npm run dev` to start the server at `http://localhost:5000`.
- The app is already configured to talk to `localhost:5000` by default in `app/lib/api.ts`.

### 4. Vercel Deployment
- Install Vercel CLI: `npm i -g vercel`
- Run `vercel` in the `server/` folder to deploy.
- Add your Environment Variables (`MONGODB_URI`, `JWT_SECRET`) in the Vercel dashboard.
- Update `API_URL` in `app/lib/api.ts` to your new Vercel production URL.

## Architecture
- **Models**: Mongoose schemas for Users, Patients, and Reports.
- **Routes**: RESTful endpoints for Auth, Dashboard Stats, Patients, and Reports.
- **Middleware**: JWT authentication and error handling.
- **App Integration**: Centralized API utility using AsyncStorage for session management.

*Note: The frontend UI remains strictly unchanged as requested.*
