# CaliTourSys: Operation Information Management System of Calabanga

**Project Description:
**
Tourism plays an important role in the economic and cultural development of local communities. However, the Municipal Tourism Office of Calabanga, Camarines Sur, continues to rely on manual and traditional processes for tourism promotion, business accreditation, and information dissemination. These practices limit the operational efficiency, real-time updates, and effective coordination between the stakeholders.

The proposed solution centralized the tourism-related information, streamlines business processes, supports the micro, small, and medium enterprises(MSMEs) and One Town One Product(OTOP) producers, and improves the visitor services. The system enhances operational efficiency, improves the accessibility of information, and strengthens the engagement between the Local Government Unit, tourism businesses, and upcoming tourists.


**Tech Stack:**
The system is built using a headless full-stack architecture to ensure scalability and professional performance:

**Frontend**: Vue.js 3 (Vite), Pinia (State Management), Vue Router.  

**Backend**: Node.js (Express.js).  

**Database**: PostgreSQL (via Supabase) with a 3rd Normal Form (3NF) relational model.  

**API**: REST API with JWT-based Authentication.

**DevOps**: GitHub Copilot for code optimization and Git Flow for team collaboration.

**Installation Guide:**
Follow these steps to set up the development environment on your local machine.

Prerequisites
Node.js (v18 or higher recommended)

PostgreSQL (or a Supabase project URL)

Git

**1. Clone the Repository**
git clone https://github.com/rayyyrayyyyy/CaliTourSys.git
cd CaliTourSys

**2. Backend Setup**
cd backend
npm install
cp .env.example .env
# Update .env with your DB_HOST, DB_NAME, and JWT_SECRET
npm run dev

**3. Frontend Setup**
cd ../frontend
npm install
cp .env.example .env
# Ensure VITE_API_BASE_URL matches your backend port (default: 5000)
npm run dev

Contributors & Roles:
     Team Member       |    Key Role     |  assigned Module
John Ray M. Amaro       Project Manager   Promotion & Marketing; Tourist Map & Discovery
Marnel R. Vasquez       Lead Analytics    Business Accreditation
Francis E. Aracosta     Lead Developer    Product Development Program
Khylene Navales         Lead Designer     Visitor Monitoring Management
