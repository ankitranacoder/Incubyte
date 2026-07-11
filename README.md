# DriveVault: Car Dealership Inventory System

DriveVault is a high-performance, single-page application (SPA) Car Dealership Inventory System. The application utilizes a Spring Boot REST API backend powered by an SQLite database, paired with a React and TypeScript frontend styled with a custom dark-glassmorphic design system using Vanilla CSS.

---

## 🌟 Key Features

### 🔒 Authentication & Role Security
- **Secure Registration & Login**: Credentials are validated and secured using BCrypt hashing.
- **JWT Authentication**: Secured endpoints verify stateless JSON Web Tokens passed in request authorization headers.
- **Role-Based Access**:
  - `USER`: Can browse the vehicle catalog, search/filter items, and purchase vehicles.
  - `ADMIN`: Possesses full CRUD capabilities (Add, Edit, Delete vehicles) and access to restock controls.

### 🚗 Vehicle Catalog & Inventory Management
- **Search & Advanced Filters**: Instantly query catalog entries by make, model, category, minimum price, or maximum price.
- **Dynamic Purchase System**: Users can purchase vehicles, which atomically decrements available stock. The purchase action is automatically disabled when stock reaches zero.
- **Restocking**: Admin users can restock any vehicle by inputting positive integers, incrementing available quantity.

### 🎨 Visual Aesthetics & UI Design
- **Glassmorphic Theme**: Sophisticated dark palette (`#09090b`) built with HSL accent styling (`indigo` and `purple` gradients), frosted-glass containers, and smooth animations.
- **Responsive Layout**: Adapts gracefully across desktop, tablet, and mobile breakpoints.
- **Custom Category SVGs**: Display customized visual silhouettes based on vehicle category (Sedan, SUV, Truck, Electric, Sports).

---

## 🛠️ Technology Stack

- **Backend**: Java 17, Spring Boot 3.3.1 (Spring Web, Spring Security, Spring Data JPA, Jakarta Validation)
- **Database**: SQLite JDBC (with Community Hibernate Dialect 6.5.2)
- **Frontend**: React 18, TypeScript, Vite 8.1.4, Lucide React (Icons)
- **Styling**: Vanilla CSS (Custom tokens, layout systems, and animations)

---

## 🚀 Setup & Execution Instructions

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Java SE Development Kit (JDK) 17** or higher
- **Node.js** (v18 or higher) and **npm**

---

### 💾 1. Database Configuration
By default, the application runs on a persistent SQLite local database file (`dealership.db`). 

To switch the application database to **MySQL**, open `backend/src/main/resources/application.properties` and replace the SQLite connection configuration with the commented-out MySQL template properties:

```properties
# Uncomment to use MySQL
# spring.datasource.url=jdbc:mysql://localhost:3306/dealership_db?createDatabaseIfNotExist=true
# spring.datasource.username=your_mysql_username
# spring.datasource.password=your_mysql_password
# spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
# spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

---

### ☕ 2. Running the Backend REST API
Move into the `backend` directory, run the Maven compiler wrapper, and boot the Spring Boot application:

```bash
cd backend
./mvnw spring-boot:run
```

The server will initialize and begin listening on **`http://localhost:8080`**.

To execute the automated JUnit integration tests:
```bash
./mvnw clean test
```

---

### ⚡ 3. Running the Frontend SPA
Navigate to the `frontend` directory, install packages, and boot the local development environment:

```bash
cd frontend
npm install
npm run dev
```

The interface will be running locally on **`http://localhost:5173`**.

To verify production bundle compilation and type checking:
```bash
npm run build
```

---

## 🧪 Testing and Verification Report

### 1. Backend Testing Coverage
The backend is backed by an automated test suite containing **16 integration and unit test cases** covering all controllers, repositories, filters, security, and transaction logic.

- **Authentication Endpoints Verified**:
  - `POST /api/auth/register` (success and conflict validation)
  - `POST /api/auth/login` (success and bad credentials validation)
- **CRUD Operations Verified**:
  - `GET /api/vehicles` (anonymous catalog listings)
  - `POST /api/vehicles` (authorization guards, schema validation)
  - `PUT /api/vehicles/{id}` (data updates, admin controls)
  - `DELETE /api/vehicles/{id}` (deletion rules)
- **Business Operations Verified**:
  - `POST /api/vehicles/{id}/purchase` (concurrency-safe decrements, out-of-stock validation)
  - `POST /api/vehicles/{id}/restock` (admin-only stock additions)
  - `GET /api/vehicles/search` (multi-criteria parameter searches)

All **16 tests pass successfully** (`BUILD SUCCESS`).

### 2. E2E API Verification Script
Validation was completed using an E2E script mimicking standard user behavior:
1. Registered `user1` (Standard) & `admin1` (Admin).
2. Logged in and fetched authorization JWT tokens.
3. Created a `Tesla Model 3` (3 units) and a `Toyota RAV4` (0 units) as admin.
4. Updated RAV4 price details to $31,990.00.
5. Restocked RAV4 with 5 units.
6. Queried catalog for "Tesla" as standard user.
7. Purchased Tesla Model 3, reducing stock successfully to 2.
8. Deleted Toyota RAV4 as admin.
9. Listed final catalog to confirm changes.

---

## 🤝 Human-AI Collaborative Development Log

This project was built using a pair-programming workflow, balancing architectural direction and design decisions with automated code generation and developer diagnostics.

### 📋 Division of Labor

| Area of Work | 👤 Human Developer | 🤖 AI Assistant (Gemini Antigravity) |
| :--- | :--- | :--- |
| **System Design** | Defined the database entities (`User`, `Vehicle`), security scopes, and concurrency-safe REST paths. | Scaffolded the JPA models and mapped Hibernate 6 community dialects for SQLite compatibility. |
| **Backend TDD** | Defined test scenarios, reviewed assertion rules, and verified database transactions for purchases and restocks. | Generated `MockMvc` integration test templates and standard security config classes. |
| **Frontend Development** | Conceived the glassmorphic aesthetics, established CSS variable tokens, and designed the category-based custom SVG illustrations. | Initialized the Vite/TypeScript folder structures and generated form-control hooks and endpoint state machines. |
| **Verification & Devops** | Authored the fallback PowerShell integration script to bypass script blocks and run verification calls directly. | Debugged strict TypeScript compiler warnings, managed local git branches, and resolved Windows environment command blocks. |

---

### 🧠 Collaboration Reflections

#### 👤 Developer Reflection
> "Using an AI assistant allowed me to focus heavily on the design phase. I spent less time setting up Spring Security boilerplate and writing CRUD endpoints, and more time engineering transactional constraints, designing the HSL glassmorphism design tokens, and thinking about edge cases like double-purchasing. The feedback loop felt natural—I dictated structural boundaries, and the AI handled the boilerplate test creation and implementation."

#### 🤖 AI Assistant Reflection
> "As the execution partner, my goal was to accelerate development without overtaking the creative process. I acted as a second pair of eyes, drafting integration tests, ensuring schema alignment, and handling code optimization. When environment-specific script policies blocked standard tools on Windows, we collaborated on workarounds (like executing cmd script targets and building API-level script fallbacks) to complete verification."

