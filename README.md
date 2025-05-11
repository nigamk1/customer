# HelpMate AI

HelpMate AI is a customer support platform that provides AI-powered chat assistance for websites.

## Features

- AI-powered chat support
- User authentication
- Website integration system
- Knowledge base management
- Real-time chat with Socket.io

## Technology Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Real-time**: Socket.io

## Deployment Instructions

### Prerequisites

- Node.js v16 or higher
- MongoDB database (local or Atlas)
- OpenAI API key

### Environment Variables

Create `.env` file in the server directory with the following:

```
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

### Deployment Options

#### Option 1: Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm run install-all && npm run build`
   - Start Command: `npm start`
4. Add the environment variables in the Render dashboard

#### Option 2: Heroku

1. Create a new app on Heroku
2. Connect your GitHub repository or use Heroku CLI
3. Add the following buildpacks:
   - heroku/nodejs
4. Set the environment variables in Heroku dashboard
5. Deploy from GitHub or using:
   ```
   git push heroku main
   ```

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
3. Start the development servers:
   ```
   npm run dev
   ```

## License

ISC