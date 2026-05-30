# 📦 Inventory & Asset Management System

A premium, enterprise-grade **Inventory & Asset Management System** designed to track physical assets, monitor stock levels across multiple locations, manage categories, and handle user authorization securely. Built with a high-performance **FastAPI** backend and a responsive, modern **Next.js** frontend.

---

## ✨ Key Features

- **Unified Asset & Stock Tracking**: Track physical assets (with unique serial numbers and purchase details) alongside standard inventory quantities across multiple physical locations.
- **Smart Analytics**: Rich, visual dashboards with interactive analytics built on top of Recharts (Next.js).
- **Role-Based Access Control (RBAC)**: Secure access with defined system roles (`ADMIN`, `MANAGER`, `VIEWER`).
- **Low Stock Alerts**: Automatically derived "low stock" statuses and threshold warnings based on customizable reorder levels.
- **Security & Performance**: Strict JWT authentication (HS256), cryptographic password hashing (bcrypt), robust CORS policies, and general + auth-specific endpoint rate limiting.
- **Swagger Documentation**: Automated, fully described interactive API documentation.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python >= 3.11)
- **Database ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Security**: [PyJWT](https://pyjwt.readthedocs.io/), [Bcrypt](https://github.com/pyca/bcrypt/), [Passlib](https://passlib.readthedocs.io/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)

### Frontend
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Component Library**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

### Database
- **Database Engine**: PostgreSQL (highly optimized for enterprise deployments like Supabase or AWS RDS)
- **Local Database**: PostgreSQL or PostgreSQL-compatible instances.

---

## 🚀 Local Setup Steps

Follow these steps to run the complete environment locally.

### Prerequisites
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- Running PostgreSQL database (or Supabase instance)

---

### 1️⃣ Backend Setup

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     source .venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   Copy the example environment file and fill in your database credentials and secret keys:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set:*
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (or a single `DATABASE_URL`)
   - `JWT_SECRET_KEY` (Generate with `python -c "import secrets; print(secrets.token_urlsafe(64))"`)

6. **Initialize and Seed the Database:**
   Run the seeding script to create database tables and populate roles, categories, locations, and a default admin user:
   ```bash
   python scripts/seed_db.py
   ```
   *Note: Check the console output for the auto-generated admin password if `SEED_ADMIN_PASSWORD` is not set in `.env`.*

7. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be running at `http://127.0.0.1:8000`. You can access the interactive Swagger docs at `http://127.0.0.1:8000/docs`.

---

### 2️⃣ Frontend Setup

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend/react-login-component
   ```

2. **Install node packages:**
   ```bash
   npm install
   ```

3. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

---

## 🔌 API Overview

All routes require JWT Authorization headers (e.g., `Authorization: Bearer <token>`) except authentication endpoints.

### Authentication & Users
| Method | Endpoint | Description | Public? |
| :--- | :--- | :--- | :---: |
| **POST** | `/users/login` | Authenticate user, update last login, and issue JWT | Yes |
| **POST** | `/users` | Register a new user account (defaults to `VIEWER`) | Yes |
| **GET** | `/users/me` | Fetch active logged-in user profile details | No |
| **GET** | `/users` | List all registered user profiles (Admin/Manager use) | No |

### Inventory Items & Assets
| Method | Endpoint | Description | Public? |
| :--- | :--- | :--- | :---: |
| **GET** | `/items` | List, search, category-filter, paginate, and sort items | No |
| **POST** | `/items` | Create new item, primary asset record, and initial location stock | No |
| **GET** | `/items/{item_id}`| Get denormalized stock, location, and serial number details | No |
| **PUT** | `/items/{item_id}`| Edit item catalog details, inventory counts, or asset status | No |
| **DELETE**| `/items/{item_id}`| Permanently delete catalog item and related stock records | No |

### Categories
| Method | Endpoint | Description | Public? |
| :--- | :--- | :--- | :---: |
| **GET** | `/categories` | List all available asset categories alphabetically | No |
| **POST** | `/categories` | Create a new unique category category | No |
| **GET** | `/categories/{id}`| Fetch details of a single category by ID | No |

### Locations
| Method | Endpoint | Description | Public? |
| :--- | :--- | :--- | :---: |
| **GET** | `/locations` | List warehouse and storage locations (active only by default)| No |
| **POST** | `/locations` | Register a new physical warehouse or storage site | No |
| **GET** | `/locations/{id}`| Retrieve specific location details | No |
| **PUT** | `/locations/{id}`| Update names, address, or active status | No |
| **DELETE**| `/locations/{id}`| Soft-delete a location (sets `is_active` to False) | No |

---

## 🌐 Live Demo
- **URL**: *To Be Decided (TBD)*
