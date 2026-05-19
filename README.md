# CaliTourSys: Operation Information Management System of Calabanga

## 📖 Project Description

Tourism plays an important role in the economic and cultural development of local communities. However, the Municipal Tourism Office of Calabanga, Camarines Sur, continues to rely on manual and traditional processes for tourism promotion, business accreditation, and information dissemination. These practices limit operational efficiency, real-time updates, and effective coordination among stakeholders.

CaliTourSys is a web-based Operation Information Management System designed to centralize tourism-related information, streamline business processes, support Micro, Small, and Medium Enterprises (MSMEs) and One Town One Product (OTOP) producers, and improve visitor services.

The system aims to:

- Improve operational efficiency of the Municipal Tourism Office
- Provide centralized tourism information management
- Enhance accessibility of tourism-related services and data
- Strengthen engagement between the Local Government Unit (LGU), tourism businesses, and tourists
- Support local tourism promotion and digital transformation initiatives

---


---

# 💻 Tech Stack

## Frontend
- Vue.js 3 (Vite)
- Pinia (State Management)
- Vue Router

## Backend
- Node.js
- Express.js

## Database
- PostgreSQL
- Supabase
- 3rd Normal Form (3NF) Relational Database Design

## API & Security
- REST API
- JWT Authentication

## DevOps & Collaboration
- GitHub Copilot
- Git Flow Workflow

---

# ⚙️ Installation Guide

Follow these steps to set up the development environment locally.

---

## 📋 Prerequisites

Ensure the following are installed on your machine:

- Node.js (v18 or higher recommended)
- PostgreSQL or Supabase Project
- Git

---

# 1️⃣ Clone the Repository

```bash
git clone https://github.com/rayyyrayyyyy/CaliTourSys.git
cd CaliTourSys
```

---

# 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
DB_HOST=your_database_host
DB_NAME=your_database_name
JWT_SECRET=your_secret_key
```

Run the backend server:

```bash
npm run dev
```

---

# 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Update the frontend environment variable:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Run the frontend development server:

```bash
npm run dev
```



# ✨ Core Features

- Tourism Information Management
- Tourist Spot Discovery
- Promotion & Marketing Management
- Tourist Map & Navigation
- Business Accreditation Management
- Visitor Monitoring Management
- Product Development Program
- OTOP & MSME Support
- Real-Time Information Updates
- User Authentication & Authorization

---

# 👥 Contributors & Roles

| Team Member | Role | Assigned Module |
|---|---|---|
| John Ray M. Amaro | Project Manager | Promotion & Marketing; Tourist Map & Discovery |
| Marnel R. Vasquez | Lead Analytics | Business Accreditation |
| Francis E. Aracosta | Lead Developer | Product Development Program |
| Khylene Navales | Lead Designer | Visitor Monitoring Management |


# 📬 Contact

For inquiries and collaboration:

- **Project Name:** CaliTourSys
- **Institution:** Municipal Tourism Office of Calabanga
- **Location:** Calabanga, Camarines Sur, Philippines

---

a