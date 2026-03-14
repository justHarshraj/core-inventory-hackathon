# Core Inventory Management System

A robust and scalable Inventory and Warehouse Management System designed for efficiency and ease of use. This project was built to streamline stock tracking, warehouse operations, and product management.

## 🚀 Features

- **Authentication**: Secure user login and registration.
- **Dashboard**: Real-time KPIs for stock levels, low-stock alerts, and pending operations.
- **Product Management**: Full CRUD operations for products, categories, and SKU tracking.
- **Warehouse & Location Management**: Organize stock across multiple warehouses and specific internal locations.
- **Inventory Operations**:
    - **Receipts**: Manage incoming stock shipments.
    - **Deliveries**: Track outgoing orders.
    - **Internal Transfers**: Move stock between locations.
    - **Stock Adjustments**: Validate and correct physical inventory counts.
- **Automated Stock Tracking**: Real-time calculation of "On Hand" vs. "Free to Use" stock levels.

## 🛠️ Tech Stack

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/): High-performance web framework for building APIs with Python.
- [SQLAlchemy](https://www.sqlalchemy.org/): SQL Toolkit and Object-Relational Mapper.
- [SQLite/PostgreSQL]: Database for reliable data persistence.

**Frontend:**
- [React](https://reactjs.org/): For a dynamic and responsive UI.
- [Vite](https://vitejs.dev/): Fast build tool and development server.
- [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework for modern styling.
- [Lucide React](https://lucide.dev/): Beautiful & consistent icon set.

## 📂 Project Structure

```text
├── backend/
│   ├── main.py            # FastAPI application entry point
│   ├── models.py          # Database models (SQLAlchemy)
│   ├── schemas.py         # Pydantic models for validation
│   ├── routes/            # API endpoints (Auth, Inventory, Products, Dashboard)
│   └── database.py        # Database connection setup
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   └── App.jsx        # Main application component
│   └── vite.config.js     # Vite configuration
└── README.md              # Project documentation
```

## ⚙️ Getting Started

### Prerequisites
- Python 3.8+
- Node.js & npm

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 📡 API Overview
The backend provides a comprehensive REST API. Key tags include:
- `Auth`: User registration and authentication.
- `Products`: CRUD actions for products and stock levels.
- `Inventory`: Warehouse, Location, and Stock Move operations.
- `Dashboard`: Aggregated KPIs for system monitoring.

You can view the interactive API documentation at `http://localhost:8000/docs`.