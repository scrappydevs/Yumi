# Aegis - Civic Infrastructure Intelligence Platform

<div align="center">

**AI-powered civic engagement platform for municipal infrastructure management with real-time issue tracking and spatial visualization.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)

[Live Demo](#) • [Documentation](#) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 🎯 Project Vision

Aegis transforms how cities manage infrastructure by providing an intelligent, data-driven platform that connects citizens, municipal workers, and AI-powered analytics. Our goal is to make infrastructure maintenance more efficient, transparent, and responsive.

### The Problem We Solve

- **Slow Response Times**: Traditional reporting systems create bottlenecks in municipal operations
- **Data Silos**: Infrastructure issues are tracked across disconnected systems
- **Limited Visibility**: Citizens lack transparency into issue resolution progress
- **Inefficient Resource Allocation**: Cities struggle to prioritize and cluster related issues

### Our Solution

Aegis provides a unified platform that:
- ✨ **Empowers Citizens** to report infrastructure issues via mobile app with photo documentation
- 🤖 **AI-Powered Analysis** automatically classifies and clusters similar issues
- 📊 **Real-Time Analytics** for municipal decision-makers with Palantir-style dashboards
- 🗺️ **3D Spatial Visualization** showing issue density and geographic patterns across 50+ US cities
- 📈 **Predictive Insights** to anticipate infrastructure maintenance needs

---

## 🌟 Key Features

### For Citizens
- 📱 **Mobile Issue Reporting** - Quick photo uploads with GPS tagging
- 📍 **Real-Time Tracking** - Follow your reported issues from submission to resolution
- 🔔 **Smart Notifications** - Get updates when issues in your area are resolved

### For Municipal Teams
- 📊 **Executive Dashboard** - KPIs, trends, and performance metrics at a glance
- 🗺️ **Interactive 3D Maps** - Visualize issue clusters with hexagon, heatmap, or scatter layers
- 🎯 **Intelligent Clustering** - AI groups related issues (e.g., potholes on the same street)
- 📈 **Analytics & Reports** - Track resolution rates, response times, and district performance
- 🔍 **Issue Management** - Prioritize, assign, and track issues through completion

### Technical Capabilities
- 🤖 **Multi-Modal AI** - Claude Sonnet 4.5 / GPT-4.1 for image analysis and classification
- 🔐 **Enterprise Security** - Row-level security, API authentication, service keys
- 🚀 **High Performance** - FastAPI backend with async operations
- 📱 **Mobile-First** - Native iOS app (in development) + responsive web dashboard
- 🌐 **Scalable Architecture** - Microservices design following industry best practices

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CITIZEN INTERFACE                          │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐       │
│  │   iOS Mobile App │              │  Web Dashboard   │       │
│  │  (SwiftUI)       │              │  (Next.js 15)    │       │
│  └────────┬─────────┘              └────────┬─────────┘       │
└───────────┼──────────────────────────────────┼─────────────────┘
            │                                  │
            │        Photo Upload + GPS        │  API Calls
            │                                  │
┌───────────▼──────────────────────────────────▼─────────────────┐
│                      BACKEND API LAYER                          │
│                    (FastAPI + Python 3.12)                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  API Routes                                            │   │
│  │  • GET  /api/issues        - Fetch all issues          │   │
│  │  • GET  /api/issues/stats  - Aggregated statistics     │   │
│  │  • GET  /api/issues/{id}   - Single issue details      │   │
│  │  • POST /api/issues        - Create new issue          │   │
│  └────────────────┬───────────────────────────────────────┘   │
│                   │                                             │
│                   ▼                                             │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  AI Processing Pipeline                                 │   │
│  │  • Image Classification (Claude/GPT-4)                  │   │
│  │  • Issue Type Detection                                 │   │
│  │  • Clustering (KNN) - Group similar issues             │   │
│  │  • Severity Assessment                                  │   │
│  └────────────────┬───────────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │  Supabase Client
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                       │
│                  (Supabase - PostgreSQL)                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Tables                                                 │   │
│  │  • issues          - Core issue tracking table          │   │
│  │    - id (uuid)                                          │   │
│  │    - image_id (text) - URL to uploaded photo           │   │
│  │    - description (text)                                 │   │
│  │    - geolocation (text) - "lat,lng" format             │   │
│  │    - timestamp (timestamptz)                            │   │
│  │    - status (enum) - complete/incomplete                │   │
│  │    - group_id (bigint) - Clustering identifier          │   │
│  │    - uid (uuid) - User who reported                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Storage Buckets                                        │   │
│  │  • issue-images    - Photo uploads from citizens        │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Philosophy

### Palantir Blueprint Aesthetic

Aegis adopts the professional, data-driven design language of Palantir's Blueprint framework:

- **Color Palette**: Deep dark theme optimized for data analysis
  - Primary: `#2D72D2` (Blueprint Blue)
  - Success: `#238551` (Blueprint Green)
  - Danger: `#CD4246` (Blueprint Red)
  - Warning: `#D99E0B` (Blueprint Gold)
  - Background: `#15191E` (Deep Dark)

- **Typography**: Inter font family for clarity and readability
- **Interactions**: Subtle hover states, smooth transitions, professional feel
- **Data Density**: Information-rich displays without clutter

---

## 💻 Tech Stack

### Frontend Dashboard
- **Framework**: Next.js 15 with App Router & Turbopack
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Maps**: Deck.gl + MapLibre for 3D visualization
- **Charts**: Recharts for analytics
- **Icons**: Lucide React
- **State**: React Hooks (useState, useEffect)

### Backend API
- **Framework**: FastAPI 0.115
- **Language**: Python 3.12
- **Database ORM**: Supabase Python Client
- **Validation**: Pydantic 2.9
- **Server**: Uvicorn (ASGI)
- **Secret Management**: Infisical
- **AI Models**: Claude Sonnet 4.5 / GPT-4.1 (planned)

### Database & Storage
- **Database**: Supabase (PostgreSQL 14)
- **Storage**: Supabase Storage for image uploads
- **Real-time**: Supabase Realtime (planned)
- **Auth**: Supabase Auth (planned)

### Mobile App (iOS)
- **Framework**: SwiftUI
- **Platform**: iOS 15+
- **Camera**: Native camera integration
- **Maps**: Apple Maps SDK
- **Status**: In Development 🚧

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Python 3.12+
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/aegis.git
cd aegis
```

### 2. Backend Setup
```bash
cd dashboard/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
API_HOST=0.0.0.0
API_PORT=8000
EOF

# Run the server
python main.py
```

Backend will be available at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

### 3. Frontend Setup
```bash
cd dashboard/frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Run development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### 4. Database Setup

1. Create a Supabase project at https://supabase.com
2. Run this SQL in the SQL Editor:

```sql
-- Create status enum
CREATE TYPE status_enum AS ENUM ('complete', 'incomplete');

-- Create issues table
CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id text,
  group_id bigint,
  description text,
  geolocation text,
  timestamp timestamptz NOT NULL DEFAULT NOW(),
  status status_enum,
  uid uuid
);

-- Create index for performance
CREATE INDEX idx_issues_timestamp ON issues(timestamp DESC);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_geolocation ON issues(geolocation);

-- Enable Row Level Security
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (backend)
CREATE POLICY "Service role has full access" ON issues
  FOR ALL
  TO service_role
  USING (true);
```

3. Add sample data:
```sql
INSERT INTO issues (description, geolocation, timestamp, status) VALUES
('Pothole on Main Street', '37.7749,-122.4194', NOW(), 'incomplete'),
('Broken streetlight', '37.7850,-122.4100', NOW(), 'incomplete'),
('Graffiti removal needed', '37.7650,-122.4300', NOW() - INTERVAL '2 days', 'complete');
```

---

## 📊 Dashboard Features

### Overview Page (`/overview`)
- **KPI Cards**: Total Issues, Resolved, In Progress, Critical
- **Trend Chart**: Reported vs Resolved issues over time
- **Category Breakdown**: Issue distribution by type
- **Recent Issues Table**: Latest reports with status badges
- **Filters**: Search and filter capabilities

### Spatial View (`/spatial`)
- **3D Map Visualization**: Interactive globe with issue clusters
- **50+ US Cities**: Pre-configured city navigation
- **Multiple Layer Types**:
  - Hexagon Layer (3D extruded density)
  - Heatmap (gradient intensity)
  - Scatterplot (individual points)
- **City Search**: Filter by state and city name
- **Real-time Stats**: Active vs resolved issue counts

### Analytics Page (`/analytics`) - Coming Soon
- Time-series analysis
- Predictive modeling
- Resolution time trends
- District comparisons

---

## 🎯 Project Goals & Roadmap

### Phase 1: Foundation ✅ (Complete)
- [x] Palantir-style dashboard UI
- [x] Backend API with FastAPI
- [x] Supabase integration
- [x] 3D map visualization
- [x] Issue tracking system
- [x] Real-time statistics

### Phase 2: AI Integration 🚧 (In Progress)
- [ ] Claude Sonnet 4.5 integration for image analysis
- [ ] Automatic issue classification
- [ ] KNN clustering for similar issues
- [ ] Severity assessment algorithm
- [ ] Pattern detection

### Phase 3: Mobile App 📱 (Planned)
- [ ] iOS SwiftUI app development
- [ ] Camera integration for photo capture
- [ ] GPS auto-tagging
- [ ] Push notifications
- [ ] Offline mode support

### Phase 4: Advanced Features 🔮 (Future)
- [ ] Real-time collaboration
- [ ] Citizen engagement portal
- [ ] Public API for third-party integrations
- [ ] Predictive maintenance algorithms
- [ ] Multi-city deployment
- [ ] Android app

### Long-term Vision 🌍
- **Scale to 100+ Cities**: Deploy across major metropolitan areas
- **Open Data Platform**: Public APIs for researchers and civic organizations
- **AI-Powered Insights**: Predictive models for infrastructure failure
- **Community Engagement**: Gamification and citizen recognition programs
- **Government Integration**: Connect with existing 311 systems

---

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions

Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Palantir Blueprint** for design inspiration
- **Supabase** for excellent developer experience
- **FastAPI** for the amazing Python framework
- **Next.js** team for the cutting-edge React framework
- **Deck.gl** for stunning 3D visualizations

---

## 📞 Contact & Support

- **Documentation**: [docs.aegis.io](#) (coming soon)
- **Email**: support@aegis.io
- **Twitter**: [@AegisInfra](#)
- **Discord**: [Join our community](#)

---

<div align="center">

**Built with ❤️ for better cities**

[⬆ Back to Top](#aegis---civic-infrastructure-intelligence-platform)

</div>
