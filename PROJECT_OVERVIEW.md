# iFix Project - Complete Setup & Architecture

## 🎯 Project Overview

iFix is a full-stack application consisting of:
- **Dashboard** - Web application for management and administration
- **Mobile** - Mobile app (planned for future implementation)
- **Backend API** - FastAPI-based REST API
- **Database** - Supabase for data storage and authentication

## 📁 Project Structure

```
iFix/
├── mobile/                    # Mobile app (empty, to be implemented)
│   └── README.md
├── dashboard/
│   ├── frontend/             # Next.js web application
│   │   ├── app/             # Next.js app directory (routes & pages)
│   │   ├── lib/             # Utilities and configurations
│   │   ├── public/          # Static assets
│   │   └── package.json     # Node dependencies
│   └── backend/             # FastAPI REST API
│       ├── main.py          # FastAPI application entry point
│       ├── supabase_client.py  # Supabase client (placeholder)
│       └── requirements.txt # Python dependencies
└── PROJECT_OVERVIEW.md      # This file
```

## 🛠 Tech Stack

### Frontend (Dashboard)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: Modern, responsive design with dark mode support
- **API Client**: Fetch API / Axios (for backend communication)

### Backend (API)
- **Framework**: FastAPI 0.115.0
- **Language**: Python 3.x
- **Server**: Uvicorn with WebSocket support
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (to be configured)

### Database & Services
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth (placeholder)
- **Storage**: Supabase Storage (if needed)

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git

### 1. Clone & Setup

```bash
# If cloning from repository
git clone <repository-url>
cd iFix

# The project structure is already set up with:
# - mobile/ (empty folder for future implementation)
# - dashboard/frontend/ (Next.js app)
# - dashboard/backend/ (FastAPI app)
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd dashboard/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (create .env file)
cat > .env << EOF
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
API_HOST=0.0.0.0
API_PORT=8000
EOF

# Start the server
python3 main.py
```

**Backend will run on**: http://localhost:8000
- API Documentation (Swagger): http://localhost:8000/docs
- Alternative Docs (ReDoc): http://localhost:8000/redoc

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd dashboard/frontend

# Install dependencies
npm install

# Configure environment (create .env.local file)
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Start development server
npm run dev
```

**Frontend will run on**: http://localhost:3000

### 4. Supabase Setup (When Ready)

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Project Settings > API
3. Update the `.env` and `.env.local` files with your credentials
4. Uncomment Supabase client initialization in:
   - `dashboard/backend/supabase_client.py`
   - `dashboard/frontend/lib/supabase.ts`

## 📡 API Endpoints

### Current Endpoints
- `GET /` - Welcome message
- `GET /health` - Health check endpoint
- `GET /api/data` - Placeholder data endpoint (Supabase integration pending)

### Planned Endpoints (Examples)
- `POST /api/auth/login` - User authentication
- `GET /api/users` - List users
- `POST /api/items` - Create item
- `GET /api/items/:id` - Get item details
- etc.

## 🎨 Features

### Current Features
✅ Next.js 15 with TypeScript
✅ Tailwind CSS with responsive design
✅ FastAPI backend with CORS configured
✅ Supabase client setup (placeholder)
✅ Modern, beautiful UI with dark mode
✅ Project structure organized

### Planned Features (To Be Implemented)
- [ ] User authentication with Supabase
- [ ] Database schema and migrations
- [ ] CRUD operations for main entities
- [ ] Real-time updates with Supabase subscriptions
- [ ] File upload with Supabase Storage
- [ ] Mobile app implementation
- [ ] Admin dashboard features
- [ ] Analytics and reporting

## 🔧 Development

### Running Both Services Simultaneously

**Option 1: Separate Terminals**
```bash
# Terminal 1 - Backend
cd dashboard/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python3 main.py

# Terminal 2 - Frontend
cd dashboard/frontend
npm run dev
```

**Option 2: Using Process Manager (e.g., concurrently)**
```bash
# Install concurrently globally
npm install -g concurrently

# From project root (create npm scripts as needed)
```

### Building for Production

**Frontend**:
```bash
cd dashboard/frontend
npm run build
npm start  # or deploy to Vercel/Netlify
```

**Backend**:
```bash
cd dashboard/backend
# Use production ASGI server
uvicorn main:app --host 0.0.0.0 --port 8000
# Or use Gunicorn with Uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🔒 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📦 Dependencies

### Frontend Dependencies
- next: ^15.5.4
- react: ^19.x
- react-dom: ^19.x
- typescript: ^5.x
- tailwindcss: ^3.x
- @supabase/supabase-js: (to be installed)

### Backend Dependencies
- fastapi: 0.115.0
- uvicorn[standard]: 0.31.0
- python-dotenv: 1.0.1
- supabase: 2.9.0
- pydantic: 2.9.2

## 🐛 Troubleshooting

### Frontend Issues
- **Port 3000 already in use**: Kill the process or use a different port with `npm run dev -- -p 3001`
- **Module not found**: Run `npm install` again
- **Environment variables not loading**: Restart the dev server after changing `.env.local`

### Backend Issues
- **Port 8000 already in use**: Kill the process or change the port in uvicorn command
- **Module import errors**: Make sure virtual environment is activated and dependencies are installed
- **CORS errors**: Check CORS configuration in `main.py`

### Supabase Issues
- **Connection failed**: Verify your Supabase URL and key
- **Auth not working**: Ensure Supabase Auth is enabled in your project settings

## 📝 Notes for AI/Developers

This project uses:
1. **Next.js App Router** (not Pages Router) - routes are defined in the `app/` directory
2. **TypeScript** for type safety in the frontend
3. **Tailwind CSS** for styling - utility-first CSS framework
4. **FastAPI** for backend with automatic OpenAPI documentation
5. **Supabase** as BaaS (Backend as a Service) - currently placeholder implementation

The project is set up with:
- ✅ No linter errors
- ✅ Proper folder structure
- ✅ Development environment ready
- ✅ Placeholder implementations for Supabase
- ⏳ Ready for feature implementation
- ⏳ Mobile app structure created but empty (intentional)

## 🎯 Next Steps

1. **Configure Supabase**:
   - Create Supabase project
   - Add credentials to environment files
   - Uncomment client initialization code

2. **Define Database Schema**:
   - Design tables in Supabase
   - Set up Row Level Security (RLS)
   - Create migrations if needed

3. **Implement Authentication**:
   - Set up Supabase Auth
   - Add login/signup pages
   - Protect routes

4. **Build Features**:
   - Define your core entities
   - Create CRUD operations
   - Build UI components

5. **Mobile App**:
   - Choose technology (React Native/Flutter/Native)
   - Set up project in `mobile/` directory
   - Integrate with API

## 📄 License

[Add your license here]

## 👥 Team

[Add team members or contributors here]

---

**Last Updated**: October 2, 2025
**Project Status**: Initial Setup Complete ✅

