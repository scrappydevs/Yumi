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
