# GearGuard - Maintenance Management Module (Odoo x Adani Uni)

GearGuard is a maintenance management system that tracks company assets and manages maintenance requests end-to-end. It connects **Equipment** (what is broken), **Teams** (who fix it), and **Requests** (the work to be done) through a workflow-driven UX.  

---

## Deployment & Demo

- Live Deployment: https://gear-guard-smoky.vercel.app/
- Demo Video: https://drive.google.com/file/d/1itdRsyXnJB1QI1Xp2P7ySfJaIIiQYLuO/view?usp=sharing

---

## Problem → Solution Mapping

This project was built to satisfy the module requirements around asset tracking, team-based maintenance operations, and an “alive” workflow with smart automation. [file:2]

---

## Core Modules

### Equipment Management
Equipment acts as the asset registry with operational metadata and ownership.

**What’s implemented**
- Equipment fields: name, serial number, **purchase date**, warranty expiry, location, department, status.
- Ownership tracking (**By Employee**): each equipment can be linked to an employee/owner (`owner_employee_id`) and filtered by employee.
- Department tracking (**By Department**): filter equipment by department.
- Responsibility mapping: each equipment stores a maintenance team and default technician that can be used for request auto-fill.

---

### Maintenance Teams
Teams represent specialized technician groups (e.g., Mechanics, Electricians, IT Support).

**What’s implemented**
- Team creation and team-member mapping (users linked to teams).
- Team-aware assignment UX: assignment/reassignment dropdown only lists members of the request’s team (UI-level enforcement).

---

### Maintenance Requests
Requests are the transactional work items for repairs and checkups.

**What’s implemented**
- Request types:
  - **Corrective** (breakdown/unplanned)
  - **Preventive** (routine/planned)
- Key fields:
  - Subject, equipment, scheduled date (preventive), priority, status, hours spent/duration.
- Smart auto-fill on request creation:
  - Selecting equipment automatically fills category + team and assigns default technician from equipment.

---

## Functional Workflows

### Flow 1: Breakdown (Corrective)
1. Any user can create a request.  
2. Selecting equipment triggers **auto-fill** for category + maintenance team (and default technician). 
3. Request starts in **New** stage.
4. Assignment is supported via **Reassign Technician** (no-auth friendly), enabling manager/technician assignment actions.
5. Execution moves the stage to **In Progress** (drag & drop).
6. Completion requires capturing **Hours Spent** when moving to **Repaired**.

---

### Flow 2: Routine Checkup (Preventive)
1. Preventive requests can be scheduled by setting `request_type = preventive`.
2. A **Scheduled Date** is recorded for the preventive job. 
3. The preventive request appears on the **Calendar View** on that specific date.

---

## UX & Views

### Maintenance Kanban Board
The Kanban board is the main technician workspace.

**Implemented**
- Columns: **New | In Progress | Repaired | Scrap**.
- Drag & drop between stages (e.g., New → In Progress).
- Technician indicator on cards (avatar/initial).
- Overdue indicator: card shows a red marker/text when a scheduled job is overdue.
- Hours modal on completion: moving to **Repaired** prompts for hours if missing.

---

### Calendar View (Preventive)
Calendar is used to plan and visualize preventive tasks.
**Implemented**
- Calendar displays **all preventive** requests with scheduled dates.
- Clicking a date opens a creation flow with prefilled:
  - `request_type = preventive`
  - `scheduled_date = clicked date`

---

### Pivot/Graph Report (Optional/Advanced)
Analytics to understand maintenance load.

**Implemented**
- Dashboard reporting such as:
  - Number of requests per team
  - Number of requests per equipment category

---

## Smart Automation & Features

### Smart “Maintenance” Button on Equipment
Each equipment card provides a smart button to jump into related maintenance tasks.

**Implemented**
- Button: **Maintenance**
- Opens requests filtered to the selected equipment.
- Badge shows count of open requests (`new` + `in_progress`).

---

### Scrap Logic
Scrapping a request should logically indicate the equipment is unusable.

**Implemented**
- When a request moves to **Scrap**, the associated equipment is updated to `status = scrapped`.

---

## Tech Stack
- Frontend: React (Vite), Tailwind CSS
- Database: Postgres (Supabase)
- UI: Drag & drop Kanban, Calendar view, modal workflows

---

## Submission Links
- Deployment: https://gear-guard-smoky.vercel.app/
- Drive Video link: https://drive.google.com/file/d/1itdRsyXnJB1QI1Xp2P7ySfJaIIiQYLuO/view?usp=sharing

---

## Team Members
- Sharv Mehta
- Vrajesh Sharma
- Avyay Kachhia
- Hardik Manglani
