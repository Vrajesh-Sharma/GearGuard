# GearGuard: The Ultimate Maintenance Tracker
## Complete Implementation Guide for Hackathon Submission

**Project Type:** Full-Stack Web Application (React + Flask + Supabase)
**Submission Focus:** UI/UX + Core Functionality + Video Explanation
**Tech Stack:** React (JSX), Tailwind CSS, Flask, Supabase PostgreSQL

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Requirements Breakdown](#core-requirements-breakdown)
3. [Database Schema](#database-schema)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Implementation Timeline](#implementation-timeline)
7. [Key Features & UI Components](#key-features--ui-components)
8. [Gamification Features](#gamification-features-optional)
9. [Video Submission Guide](#video-submission-guide)

---

## Project Overview

**Objective:** Build a maintenance management system that tracks assets and manages maintenance requests with seamless connection between Equipment, Teams, and Requests.

**Core Philosophy:** 
- Equipment (what is broken)
- Teams (who fixes it)
- Requests (work to be done)

**Success Metrics for Hackathon:**
- ✅ All UI screens implemented and responsive
- ✅ Core workflows functioning (Breakdown & Routine Checkup)
- ✅ Database schema properly designed in Supabase
- ✅ Drag-and-drop Kanban board working
- ✅ Calendar view with preventive maintenance scheduling
- ✅ Smart auto-fill logic and assignment system
- ✅ Professional video demonstration (3-5 minutes)

---

## Core Requirements Breakdown

### 1. Equipment Management (Core)
**Purpose:** Central database for all company assets

#### Key Features:
- **Add/Edit/Delete Equipment**
  - Equipment Name & Serial Number
  - Purchase Date & Warranty Information
  - Location (physical address/department)
  - Department assignment
  - Employee/Owner assignment
  - Assigned Maintenance Team
  - Default Technician

- **Equipment Tracking Views**
  - Filter by Department
  - Filter by Employee
  - Search functionality
  - Equipment list view

- **Smart Button**
  - "Maintenance" button on equipment card
  - Shows count of open requests
  - Links to related maintenance requests

---

### 2. Maintenance Team Management (Core)
**Purpose:** Organize technicians into specialized teams

#### Key Features:
- **Team CRUD Operations**
  - Create team (e.g., Mechanics, Electricians, IT Support)
  - Add/remove team members
  - Set team description

- **Team Member Management**
  - Link technicians to teams
  - View team members
  - Assign default technician to equipment

---

### 3. Maintenance Request Management (Core)
**Purpose:** Handle lifecycle of repair jobs

#### Request Types:
- **Corrective:** Unplanned repairs (Breakdowns)
- **Preventive:** Planned maintenance (Routine Checkups)

#### Key Fields:
- Subject (description of issue)
- Equipment (affected asset)
- Team (assigned team)
- Technician (assigned person)
- Request Type (Corrective/Preventive)
- Scheduled Date (for preventive)
- Duration/Hours Spent
- Status (New → In Progress → Repaired/Scrap)

#### Request States/Stages:
1. **New** - Request created, awaiting assignment
2. **In Progress** - Being worked on
3. **Repaired** - Completed successfully
4. **Scrap** - Equipment marked as non-usable

---

### 4. Workflow Automation (Core)

#### Flow 1: The Breakdown (Corrective Maintenance)
```
Step 1: User creates request
   ↓
Step 2: User selects Equipment
   ↓
Step 3: System AUTO-FILLS:
   - Equipment Category
   - Maintenance Team
   - Default Technician
   ↓
Step 4: Request created in "New" stage
   ↓
Step 5: Manager/Technician assigns themselves
   ↓
Step 6: Technician moves to "In Progress"
   ↓
Step 7: Technician records Hours Spent
   ↓
Step 8: Technician moves to "Repaired"
```

#### Flow 2: The Routine Checkup (Preventive Maintenance)
```
Step 1: Manager creates request (Type: Preventive)
   ↓
Step 2: Manager sets Scheduled Date
   ↓
Step 3: Request appears on Calendar View
   ↓
Step 4: Technician sees job on calendar
   ↓
Step 5: Technician completes maintenance
```

---

## Database Schema

### Supabase Tables & Structure

#### 1. `users` Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'technician'
  avatar_url TEXT,
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `teams` Table
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  specialty VARCHAR(255), -- e.g., 'Mechanics', 'Electricians', 'IT Support'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `equipment` Table
```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100), -- 'Machinery', 'Vehicle', 'Computer'
  purchase_date DATE,
  warranty_expiry DATE,
  location VARCHAR(255), -- Physical location
  department VARCHAR(255), -- Department assignment
  owner_employee_id UUID REFERENCES users(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  default_technician_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'scrapped'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `maintenance_requests` Table
```sql
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  assigned_technician_id UUID REFERENCES users(id),
  request_type VARCHAR(50) NOT NULL, -- 'corrective' or 'preventive'
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'in_progress', 'repaired', 'scrap'
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
  scheduled_date DATE,
  completed_date DATE,
  hours_spent DECIMAL(5,2),
  notes TEXT,
  is_overdue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

#### 5. `maintenance_history` Table (Optional - for tracking)
```sql
CREATE TABLE maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. `user_scores` Table (For Gamification)
```sql
CREATE TABLE user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  score_points INT DEFAULT 0,
  requests_completed INT DEFAULT 0,
  average_rating DECIMAL(3,2),
  streak_days INT DEFAULT 0,
  last_action_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Relationships:
```
users ← team_id → teams
users ← team_id → equipment (team assignments)
users ← default_technician_id → equipment
users ← owner_employee_id → equipment
equipment ← team_id → teams
maintenance_requests ← team_id → teams
maintenance_requests ← equipment_id → equipment
maintenance_requests ← assigned_technician_id → users
maintenance_requests ← created_by → users
```

---

## Frontend Architecture

### Project Structure
```
gearguard-frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── Equipment/
│   │   │   ├── EquipmentList.jsx
│   │   │   ├── EquipmentForm.jsx
│   │   │   ├── EquipmentCard.jsx
│   │   │   └── EquipmentDetail.jsx
│   │   ├── Maintenance/
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── KanbanColumn.jsx
│   │   │   ├── RequestCard.jsx
│   │   │   ├── RequestForm.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   └── RequestDetail.jsx
│   │   ├── Teams/
│   │   │   ├── TeamList.jsx
│   │   │   ├── TeamForm.jsx
│   │   │   └── TeamCard.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── PriorityChart.jsx
│   │   │   └── TeamPerformanceChart.jsx
│   │   └── Common/
│   │       ├── Modal.jsx
│   │       ├── Button.jsx
│   │       ├── Badge.jsx
│   │       └── LoadingSpinner.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Equipment.jsx
│   │   ├── Maintenance.jsx
│   │   ├── Teams.jsx
│   │   ├── Dashboard.jsx
│   │   └── NotFound.jsx
│   ├── hooks/
│   │   ├── useEquipment.js
│   │   ├── useMaintenanceRequests.js
│   │   ├── useTeams.js
│   │   └── useAuth.js
│   ├── services/
│   │   ├── api.js (Axios config)
│   │   ├── equipmentService.js
│   │   ├── maintenanceService.js
│   │   ├── teamService.js
│   │   └── authService.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── dateHelpers.js
│   │   └── constants.js
│   ├── styles/
│   │   └── tailwind.config.js
│   ├── App.jsx
│   └── main.jsx
├── public/
└── package.json
```

### Key Components to Build

#### 1. **KanbanBoard.jsx** (Most Important UI)
- Displays 4 columns: New, In Progress, Repaired, Scrap
- Drag-and-drop functionality (use react-beautiful-dnd)
- Shows request cards with:
  - Request subject
  - Equipment name
  - Assigned technician avatar
  - Overdue indicator (red stripe)
  - Priority color coding
  - Hours spent

#### 2. **RequestCard.jsx**
- Compact card display
- Drag handle
- Color-coded status
- Overdue indicator
- Technician avatar
- Click to expand details

#### 3. **CalendarView.jsx**
- Display preventive maintenance requests on calendar
- Click on date to create new request
- Show request count per day
- Color-code by priority

#### 4. **EquipmentList.jsx**
- Display all equipment
- Search functionality
- Filter by department/employee
- Equipment card with "Maintenance" button
- Badge showing open request count

#### 5. **Dashboard.jsx**
- Overview stats:
  - Total requests
  - Open requests
  - Overdue requests
  - Team performance
- Charts (optional):
  - Requests per team (bar chart)
  - Requests per equipment category (pie chart)

#### 6. **RequestForm.jsx**
- Auto-fill logic when equipment selected
- Form fields:
  - Subject
  - Equipment (dropdown → triggers auto-fill)
  - Team (auto-filled, but editable)
  - Technician (dropdown from team members)
  - Request Type (corrective/preventive)
  - Scheduled Date (for preventive)
  - Priority
  - Description

---

## Backend Architecture

### Flask API Structure
```
gearguard-backend/
├── app.py
├── config.py
├── requirements.txt
├── routes/
│   ├── __init__.py
│   ├── auth.py
│   ├── equipment.py
│   ├── maintenance.py
│   ├── teams.py
│   └── dashboard.py
├── services/
│   ├── __init__.py
│   ├── equipment_service.py
│   ├── maintenance_service.py
│   ├── team_service.py
│   └── auth_service.py
├── models/
│   ├── __init__.py
│   ├── equipment.py
│   ├── maintenance_request.py
│   ├── team.py
│   └── user.py
├── middleware/
│   ├── auth_middleware.py
│   └── error_handler.py
└── utils/
    ├── decorators.py
    └── helpers.py
```

### API Endpoints

#### Equipment Endpoints
```
GET    /api/equipment              - List all equipment
GET    /api/equipment/:id          - Get equipment detail
POST   /api/equipment              - Create equipment
PUT    /api/equipment/:id          - Update equipment
DELETE /api/equipment/:id          - Delete equipment
GET    /api/equipment/:id/requests - Get requests for equipment (smart button)
GET    /api/equipment/search?q=    - Search equipment
GET    /api/equipment/filter?dept= - Filter by department
```

#### Maintenance Endpoints
```
GET    /api/requests               - List all requests
GET    /api/requests/:id           - Get request detail
POST   /api/requests               - Create request (with auto-fill logic)
PUT    /api/requests/:id           - Update request
PUT    /api/requests/:id/status    - Update request status (Kanban drag)
DELETE /api/requests/:id           - Delete request
GET    /api/requests/schedule?date=- Get scheduled requests for date
POST   /api/requests/:id/assign    - Assign technician
POST   /api/requests/:id/complete  - Complete request
```

#### Team Endpoints
```
GET    /api/teams                  - List all teams
GET    /api/teams/:id              - Get team detail
POST   /api/teams                  - Create team
PUT    /api/teams/:id              - Update team
DELETE /api/teams/:id              - Delete team
GET    /api/teams/:id/members      - Get team members
POST   /api/teams/:id/members      - Add member to team
DELETE /api/teams/:id/members/:uid - Remove member from team
```

#### Dashboard Endpoints
```
GET    /api/dashboard/stats        - Overall stats
GET    /api/dashboard/team-perf    - Team performance
GET    /api/dashboard/requests-by-team - Requests grouped by team
GET    /api/dashboard/requests-by-category - Requests by equipment category
```

### Key Auto-Fill Logic (Backend)
```python
# When equipment_id is selected, return:
{
  "id": "equipment-id",
  "name": "CNC Machine 01",
  "team_id": "team-id",
  "team_name": "Mechanics",
  "default_technician_id": "user-id",
  "default_technician_name": "John Doe",
  "category": "Machinery"
}
```

---

## Implementation Timeline

### Phase 1: Setup & Database (Day 1 - 2 Hours)
- [ ] Create Supabase project
- [ ] Set up all database tables
- [ ] Create Supabase Row Level Security (RLS) policies
- [ ] Initialize React project with Vite
- [ ] Set up Flask project structure
- [ ] Configure Tailwind CSS

### Phase 2: Backend Core APIs (Day 1-2 - 3 Hours)
- [ ] Implement authentication (JWT)
- [ ] Equipment CRUD + Auto-fill logic
- [ ] Team CRUD
- [ ] Maintenance Request CRUD
- [ ] Status update endpoint (for Kanban)
- [ ] Dashboard stats endpoint
- [ ] Test all endpoints with Postman

### Phase 3: Frontend - Core Pages (Day 2 - 4 Hours)
- [ ] Navbar + Sidebar navigation
- [ ] Equipment List page (with search/filter)
- [ ] Equipment Detail page (with maintenance button)
- [ ] Team List page
- [ ] Maintenance Request List page
- [ ] Create Request form (with auto-fill)

### Phase 4: Frontend - Advanced UI (Day 2-3 - 3 Hours)
- [ ] Kanban Board (with react-beautiful-dnd)
- [ ] Drag-drop status update
- [ ] Calendar View
- [ ] Request detail modal/page
- [ ] Dashboard with stats
- [ ] Responsive design refinement

### Phase 5: Polish & Testing (Day 3 - 2 Hours)
- [ ] Bug fixes
- [ ] Loading states & error handling
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Gamification features (optional)

### Phase 6: Video Submission Prep (Final - 1 Hour)
- [ ] Create demo data
- [ ] Script video demonstration
- [ ] Record and edit video

---

## Key Features & UI Components

### 1. Kanban Board (Priority: Critical)
**Location:** `/maintenance` route

**Features:**
- 4 columns: New | In Progress | Repaired | Scrap
- Drag-and-drop cards between columns
- Real-time status update
- Visual indicators:
  - Overdue requests (red stripe/badge)
  - Priority colors (red=high, yellow=medium, blue=low)
  - Technician avatar
  - Equipment icon

**Mockup:**
```
┌─────────────────────────────────────────────────────┐
│  📋 MAINTENANCE KANBAN BOARD                         │
├──────────────┬──────────────┬──────────────┬────────┤
│ NEW (5)      │ IN PROGRESS  │ REPAIRED (8) │ SCRAP  │
├──────────────┼──────────────┼──────────────┼────────┤
│ ┌──────────┐ │ ┌──────────┐ │              │        │
│ │🔴 Oil    │ │ │👨 Leaking│ │              │        │
│ │Leak      │ │ │ Hydraul  │ │              │        │
│ │CNC Mach  │ │ │ John Doe │ │              │        │
│ │HIGH PRIO │ │ │ 2h spent │ │              │        │
│ └──────────┘ │ └──────────┘ │              │        │
│              │              │              │        │
│ ┌──────────┐ │              │              │        │
│ │ Printer  │ │              │              │        │
│ │Error E4  │ │              │              │        │
│ │Auto Assign│ │              │              │        │
│ └──────────┘ │              │              │        │
└──────────────┴──────────────┴──────────────┴────────┘
```

---

### 2. Calendar View (Priority: High)
**Location:** `/maintenance/calendar`

**Features:**
- Month/week calendar display
- Preventive maintenance requests highlighted
- Request count per day
- Click to create new request
- Hover to see request details
- Color-coded by priority

**Tech:** React Calendar library or custom grid

---

### 3. Equipment Management (Priority: High)
**Location:** `/equipment`

**Features:**
- Equipment list/grid view
- Search by name, serial number, location
- Filter by department, employee
- Equipment cards showing:
  - Equipment image/icon
  - Name & Serial Number
  - Department & Location
  - Assigned Team
  - **"Maintenance" button with open request badge**
- Click "Maintenance" → Shows related requests only
- Equipment detail modal/page

---

### 4. Request Form with Auto-Fill (Priority: Critical)
**Features:**
- Form fields:
  ```
  [Subject] ________________
  [Equipment] [Dropdown ▼] (triggers auto-fill)
  [Category] ________________ (auto-filled)
  [Team] ________________ (auto-filled)
  [Technician] [Dropdown ▼] (filtered by team)
  [Request Type] ○ Corrective ○ Preventive
  [Scheduled Date] [Date Picker] (for preventive)
  [Priority] [Dropdown]
  [Description] [Text Area]
  ```

- Auto-fill triggers:
  - User selects equipment
  - System fetches equipment data
  - Auto-populates: Category, Team, Default Technician
  - Technician dropdown filtered to show only team members

---

### 5. Dashboard (Priority: Medium)
**Location:** `/dashboard`

**Stats Cards:**
- Total Requests
- Open Requests (New + In Progress)
- Overdue Requests
- Completed This Month

**Charts:**
- Requests per Team (bar chart)
- Requests per Equipment Category (pie chart)
- Team Performance (response time, completion rate)

---

## Gamification Features (Optional)

### Add These for Extra Points:

#### 1. **Technician Leaderboard**
- Points system:
  - Completed request: +50 points
  - On-time completion: +25 bonus
  - High customer rating: +10 points
  - 7-day streak: +100 bonus

#### 2. **Achievement Badges**
- 🏅 Speed Demon (5 requests in 1 day)
- 🏅 Perfectionist (10 consecutive on-time completions)
- 🏅 Team Player (50 requests completed)
- 🏅 Lifeguard (10 critical priority requests handled)

#### 3. **Daily Challenges**
- Complete 3 requests today
- Finish all scheduled preventive maintenance
- Help a teammate

#### 4. **Notifications & Activity Feed**
- "John completed a request in 2 hours (new record!)"
- "Team Mechanics achieved 95% on-time rate"
- Notification badges on navbar

#### 5. **Visual Progress Indicators**
- Technician profile card with:
  - Profile picture
  - Current rank/level
  - Points progress bar
  - Completed requests count
  - Average completion time

---

## Video Submission Guide

### Structure (3-5 Minutes)

#### Minute 0-30 seconds: **Introduction**
- Project name: "GearGuard - The Ultimate Maintenance Tracker"
- Problem statement: "Companies struggle to manage maintenance efficiently"
- Solution: "Centralized system with Kanban board, calendar, and smart automation"

#### Minute 0:30-1:30: **Core Features Demo**
1. **Equipment Management**
   - Show equipment list
   - Filter by department
   - Click "Maintenance" button
   - Show related requests

2. **Create Maintenance Request**
   - Click "Create Request"
   - Select equipment
   - Watch auto-fill happen (team, technician populate automatically)
   - Submit request

#### Minute 1:30-2:30: **Kanban Board**
- Show all 4 columns: New | In Progress | Repaired | Scrap
- Drag a request from "New" to "In Progress"
- Show status update animation
- Highlight overdue indicator (red stripe)
- Show technician avatar
- Click request card to see details

#### Minute 2:30-3:30: **Calendar View**
- Show calendar with preventive maintenance dates
- Click on scheduled request
- Show request details
- Navigate back to calendar

#### Minute 3:30-4:00: **Dashboard & Summary**
- Quick overview of stats
- Show team performance chart
- Summarize key features
- Mention gamification (if implemented)

#### Minute 4:00-4:30: **Tech Stack Highlight**
- "Built with React, Flask, Tailwind CSS, and Supabase"
- Mention database schema
- Highlight auto-fill logic and drag-drop functionality
- Conclude with competitive edge

### Recording Tips:
1. **Use demo data** - Create 5-10 sample equipment and requests
2. **Smooth transitions** - Use screen recording tools (OBS, ScreenFlow, ShareX)
3. **Clear audio** - Speak clearly, use good microphone
4. **Zoom in on UI** - Make text readable (150-200% zoom if needed)
5. **Show loading states** - Demonstrate responsiveness
6. **Highlight unique features** - Auto-fill logic, drag-drop, calendar

### Tools:
- **Recording:** OBS Studio (free), Loom, ScreenFlow (Mac)
- **Editing:** DaVinci Resolve (free), Adobe Premiere
- **Upload:** YouTube (unlisted), Google Drive, Vimeo

---

## Development Checklist

### Pre-Development
- [ ] Supabase account created & project setup
- [ ] PostgreSQL database schema created
- [ ] React project initialized with Vite
- [ ] Flask project structure created
- [ ] Environment variables configured (.env files)
- [ ] Git repository initialized

### Backend Development
- [ ] User authentication (signup/login)
- [ ] Equipment CRUD + auto-fill logic
- [ ] Team management CRUD
- [ ] Maintenance request CRUD
- [ ] Status update functionality
- [ ] Dashboard stats endpoints
- [ ] Error handling & validation
- [ ] CORS configuration
- [ ] API documentation

### Frontend Development
- [ ] Layout components (Navbar, Sidebar)
- [ ] Equipment pages (list, detail, form)
- [ ] Team pages (list, detail, form)
- [ ] Maintenance pages (list, form, detail)
- [ ] Kanban board with drag-drop
- [ ] Calendar view
- [ ] Dashboard with charts
- [ ] Modal dialogs
- [ ] Loading & error states
- [ ] Mobile responsiveness
- [ ] Toast notifications
- [ ] Authentication flow

### Testing & Polish
- [ ] API endpoint testing
- [ ] Form validation testing
- [ ] Auto-fill logic verification
- [ ] Drag-drop functionality testing
- [ ] Calendar date selection testing
- [ ] Responsive design testing
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Code cleanup & documentation

### Gamification (Optional)
- [ ] User scores table
- [ ] Leaderboard page
- [ ] Points calculation logic
- [ ] Achievement logic
- [ ] Badge display components
- [ ] Notification system

### Video & Submission
- [ ] Demo data created
- [ ] Screen recording completed
- [ ] Video edited & titled
- [ ] Audio quality verified
- [ ] Uploaded to platform
- [ ] README.md created
- [ ] GitHub repo organized

---

## Dependencies & Libraries

### Frontend (React)
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "tailwindcss": "^3.x",
  "react-beautiful-dnd": "^13.x",
  "react-calendar": "^4.x",
  "recharts": "^2.x",
  "react-hot-toast": "^2.x",
  "date-fns": "^2.x",
  "clsx": "^2.x",
  "zustand": "^4.x",
  "supabase": "^2.x"
}
```

### Backend (Flask)
```
Flask==3.0.0
Flask-CORS==4.0.0
python-dotenv==1.0.0
supabase==2.0.0
PyJWT==2.8.0
python-decouple==3.8
gunicorn==21.2.0
requests==2.31.0
```

---

## Deployment Notes

### Frontend (Recommended: Vercel/Netlify)
```bash
npm run build
# Deploy dist folder to Vercel/Netlify
```

### Backend (Recommended: Render/Railway)
```bash
pip install -r requirements.txt
gunicorn app:app
```

### Environment Variables
```
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

---

## Success Criteria for Hackathon

### Must Have (100 Points)
- ✅ Equipment CRUD fully functional
- ✅ Team CRUD fully functional
- ✅ Request creation with auto-fill logic
- ✅ Kanban board with 4 stages
- ✅ Drag-drop status update
- ✅ Calendar view with preventive scheduling
- ✅ Smart "Maintenance" button on equipment
- ✅ Responsive UI design
- ✅ All workflows documented
- ✅ Professional 3-5 minute video

### Should Have (20 Points)
- ✅ Dashboard with charts
- ✅ Advanced filters & search
- ✅ Overdue request indicators
- ✅ User assignment workflow
- ✅ Request detail pages

### Nice to Have (10 Points)
- ✅ Gamification system
- ✅ Email notifications
- ✅ Dark mode toggle
- ✅ Advanced reporting
- ✅ Export to CSV

---

## Final Tips for Hackathon

1. **Focus on UI/UX First** - Judges will see this first
   - Clean, professional design
   - Intuitive workflows
   - Smooth animations

2. **Complete Workflows** - Show end-to-end functionality
   - Equipment creation → Request creation → Kanban drag → Completion
   - Preventive maintenance scheduling → Calendar display

3. **Auto-Fill Logic is Key** - This is the "wow" moment
   - When user selects equipment, fields populate automatically
   - Highlight this in video demo

4. **Professional Video** - 50% of impression comes from this
   - Clear narration
   - Smooth screen transitions
   - Showcase all major features
   - Mention tech stack briefly

5. **Database Design** - Shows architectural thinking
   - Proper relationships
   - Scalable schema
   - Good naming conventions

6. **Code Quality** - Even if not judged directly
   - Clean, readable code
   - Proper error handling
   - Component modularization

7. **Time Management**
   - Don't over-build optional features
   - Prioritize core workflows
   - Save time for polish and video
   - Test thoroughly before demo

---

## Quick Start Commands

### Frontend
```bash
npm create vite@latest gearguard-frontend -- --template react
cd gearguard-frontend
npm install
npm install react-router-dom axios react-beautiful-dnd react-calendar recharts react-hot-toast date-fns zustand
npm run dev
```

### Backend
```bash
mkdir gearguard-backend
cd gearguard-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install Flask Flask-CORS python-dotenv supabase PyJWT python-decouple
touch app.py .env
# Start: python app.py
```

---

## Contact & Support

**For Questions During Development:**
- Check Supabase documentation: https://supabase.com/docs
- React documentation: https://react.dev
- Flask documentation: https://flask.palletsprojects.com
- Tailwind CSS: https://tailwindcss.com/docs

**Critical Resources:**
- Supabase Python SDK: https://github.com/supabase/supabase-py
- React Beautiful DND: https://github.com/atlassian/react-beautiful-dnd
- Recharts: https://recharts.org/

---

**Last Updated:** December 27, 2025
**Version:** 1.0
**Project Status:** Ready for Implementation

Good luck with your hackathon! 🚀





---
Hardik was here