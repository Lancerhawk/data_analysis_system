# Data Analyzer - Setup Guide

This is a full-stack data analysis application with a FastAPI backend and React frontend.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
2. **Node.js 16+ and Yarn** - [Download Node.js](https://nodejs.org/) and install Yarn: `npm install -g yarn`
3. **MongoDB** - Either:
   - Local MongoDB installation: [Download MongoDB](https://www.mongodb.com/try/download/community)
   - OR MongoDB Atlas account (free tier available): [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## Project Structure

```
data analyzer/
├── backend/          # FastAPI Python backend
│   ├── server.py     # Main server file
│   ├── requirements.txt
│   └── uploads/      # Uploaded files storage
└── frontend/         # React frontend
    ├── src/
    └── package.json
```

## Setup Instructions

### Step 1: Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file:**
   ```bash
   # Copy the example file
   copy .env.example .env    # Windows
   # OR
   cp .env.example .env      # macOS/Linux
   ```

5. **Edit `.env` file with your MongoDB connection:**
   - For **local MongoDB**: `MONGO_URL=mongodb://localhost:27017`
   - For **MongoDB Atlas**: `MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/`
   - Set `DB_NAME=file_analyzer` (or your preferred database name)
   - Set `CORS_ORIGINS=http://localhost:3000` (for development)

6. **Start MongoDB (if using local MongoDB):**
   ```bash
   # Windows (if installed as service, it should start automatically)
   # Or run: mongod

   # macOS (if installed via Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

7. **Run the backend server:**
   ```bash
   python server.py
   ```
   
   Or alternatively:
   ```bash
   uvicorn server:app --reload --port 8000
   ```

   The backend should now be running at `http://localhost:8000`

### Step 2: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```
   (If you don't have Yarn, you can use `npm install` instead, but the project uses Yarn)

3. **Create environment file:**
   ```bash
   # Copy the example file
   copy .env.example .env    # Windows
   # OR
   cp .env.example .env      # macOS/Linux
   ```

4. **Edit `.env` file:**
   - Set `REACT_APP_BACKEND_URL=http://localhost:8000` (should match your backend URL)

5. **Start the frontend development server:**
   ```bash
   yarn start
   ```
   (Or `npm start` if using npm)

   The frontend should now be running at `http://localhost:3000`

## Running the Application

1. **Start the backend** (Terminal 1):
   ```bash
   cd backend
   # Activate virtual environment if using one
   python server.py
   ```

2. **Start the frontend** (Terminal 2):
   ```bash
   cd frontend
   yarn start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: 
  - Make sure MongoDB is running (if using local MongoDB)
  - Check your `MONGO_URL` in `.env` file
  - For MongoDB Atlas, ensure your IP is whitelisted in the Atlas dashboard

- **Port 8000 already in use**:
  - Change the port: `uvicorn server:app --reload --port 8001`
  - Update `REACT_APP_BACKEND_URL` in frontend `.env` accordingly

- **Python dependencies not installing**:
  - Make sure you're using Python 3.8+
  - Try upgrading pip: `python -m pip install --upgrade pip`

### Frontend Issues

- **Port 3000 already in use**:
  - The React dev server will prompt you to use a different port
  - Or set it manually: `PORT=3001 yarn start`

- **Backend connection errors**:
  - Verify backend is running at the URL specified in `REACT_APP_BACKEND_URL`
  - Check CORS settings in backend `.env` file
  - Make sure both servers are running

- **Yarn/npm install errors**:
  - Delete `node_modules` and `yarn.lock` (or `package-lock.json`)
  - Run `yarn install` again
  - If issues persist, try `yarn cache clean` then reinstall

## Features

- Upload and analyze CSV, JSON, and Excel files
- View file statistics and column information
- Handle null values with various methods
- Create visualizations (histograms, scatter plots, bar charts, etc.)
- Convert files between formats (CSV, JSON, Excel)
- Download sample datasets for testing

## API Endpoints

- `GET /api/` - API health check
- `POST /api/upload` - Upload and analyze a file
- `GET /api/files` - Get all uploaded files
- `GET /api/files/{file_id}` - Get specific file analysis
- `POST /api/handle-nulls` - Handle null values in a file
- `POST /api/visualize` - Create visualizations
- `POST /api/convert` - Convert file format
- `GET /api/download/{download_id}` - Download converted file
- `GET /api/sample-dataset/{dataset_type}` - Get sample dataset (sales, customer, employee)

## Environment Variables Summary

### Backend (.env)
- `MONGO_URL` - MongoDB connection string (required)
- `DB_NAME` - Database name (required)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated, optional, defaults to '*')

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - Backend API URL (required)

## Production Deployment

For production deployment:

1. **Backend:**
   - Use a production ASGI server like Gunicorn with Uvicorn workers
   - Set proper CORS origins
   - Use environment variables for sensitive data
   - Set up proper MongoDB connection pooling

2. **Frontend:**
   - Build the production bundle: `yarn build`
   - Serve the `build` folder with a web server (nginx, Apache, etc.)
   - Update `REACT_APP_BACKEND_URL` to your production API URL

## Support

If you encounter any issues, check:
1. All dependencies are installed correctly
2. Environment variables are set correctly
3. MongoDB is running and accessible
4. Both backend and frontend servers are running
5. Ports are not conflicting with other applications

