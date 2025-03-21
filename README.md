# ChatterBox

A real-time chat web application built with React and Express that can be deployed to Render.

## Features

- User authentication (login/signup)
- Real-time messaging with WebSockets
- Direct messaging between users
- Online status indicators
- Message delivery confirmation
- Responsive design for mobile and desktop
- Light mode UI

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, WebSockets
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom token-based authentication

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (see `.env.example`)
4. Start the development server:
   ```
   npm run dev
   ```

## Deployment to Render

This application is configured for easy deployment to Render using the `render.yaml` file.

### Using the Render Dashboard

1. Sign up for a [Render account](https://render.com)
2. Connect your GitHub repository
3. Click "New Web Service"
4. Select your repository
5. Render will automatically detect the configuration from `render.yaml`
6. Click "Apply"

### Using the Render CLI

1. Install the Render CLI
2. Login to your Render account
3. Run:
   ```
   render blueprint apply
   ```

## Database Schema

- **users**: User accounts and authentication info
- **messages**: Public chat messages
- **direct_messages**: Private messages between users

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: 'development' or 'production'

## License

MIT