# Restaurant Automation and Order Management System

A web-based restaurant management application developed to simplify restaurant operations such as menu management, table management, customer orders, cart management, payments and feedback.

The project demonstrates the practical application of **Distributed Computing and Cloud Computing** concepts through a three-tier architecture and cloud deployment.

## 🌐 Live Application

- **Frontend:** https://restaurant-management-frontend-iota.vercel.app/
- **Backend API:** https://restaurant-management-backend-ihdt.onrender.com/
- **GitHub Repository:** https://github.com/Professor432/205226014

## 🏗️ System Architecture

The application follows a **Three-Tier Architecture** with separately deployed frontend, backend and database components.

```text
             Users / Admin
                   |
                   v
          React Frontend
              (Vercel)
                   |
             REST API
             HTTPS/HTTP
                   |
                   v
        Node.js + Express Backend
               (Render)
                   |
              PostgreSQL
                (Neon)
```

### Architecture Components

| Layer | Technology | Deployment |
|---|---|---|
| Presentation Layer | React.js | Vercel |
| Application Layer | Node.js, Express.js | Render |
| Data Layer | PostgreSQL | Neon |

The frontend communicates with the backend using REST APIs. The backend processes requests and interacts with the PostgreSQL database.

The backend follows a **modular monolithic architecture**, with separate route modules for different application functionalities.

## ✨ Key Features

- User registration and authentication
- Menu and category management
- Restaurant table management
- Shopping cart management
- Customer order placement and management
- Payment-related functionality
- Customer feedback management
- Admin operations
- Order and application data analysis

## 🛠️ Technology Stack

### Frontend
- React.js
- JavaScript
- HTML
- CSS

### Backend
- Node.js
- Express.js
- REST APIs
- JSON Web Token (JWT) authentication

### Database
- PostgreSQL
- Neon Cloud Database
- Node PostgreSQL (`pg`) package

### Cloud and Deployment
- **Vercel:** Frontend hosting
- **Render:** Backend hosting
- **Neon:** Managed PostgreSQL database

### Performance Testing
- Apache JMeter 5.6.3

## ☁️ Cloud Deployment

The application is deployed using three cloud services.

### 1. Frontend Deployment – Vercel

- The React frontend is deployed on Vercel.
- The frontend project uses the `Main/frontend` directory.
- The production build is generated using `npm run build`.
- The backend API URL is configured through the environment variable:

```env
REACT_APP_API_URL=https://restaurant-management-backend-ihdt.onrender.com/
```

### 2. Backend Deployment – Render

- The Node.js and Express backend is deployed as a web service on Render.
- The backend project uses the `Main/backend-node` directory.
- Build command:

```bash
npm install
```

- Start command:

```bash
npm start
```

- The backend uses environment variables for database connectivity and authentication.

### 3. Database Deployment – Neon

- PostgreSQL is hosted using Neon.
- The database is deployed in the AWS Asia Pacific (Singapore) region.
- The backend connects to the database using the PostgreSQL connection configuration.

## 🔐 Environment Variables

Configure the following environment variables in the respective deployment platforms.

### Backend – Render

```env
POSTGRES_URL=your_postgresql_connection_string
DB_SSL=true
ACCESS_TOKEN_SECRET=your_jwt_secret
```

### Frontend – Vercel

```env
REACT_APP_API_URL=https://restaurant-management-backend-ihdt.onrender.com/
```

**Security Note:** Never commit database credentials, JWT secrets, API keys or other sensitive information to GitHub. Configure them through the environment variable settings of the deployment platforms.

## 💻 Local Setup

Follow these steps to run the application locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Professor432/205226014.git
cd 205226014
```

### 2. Start the Backend

```bash
cd Main/backend-node
npm install
```

Configure the backend environment variables in a `.env` file, then run:

```bash
npm start
```

### 3. Start the Frontend

Open another terminal:

```bash
cd Main/frontend
npm install
```

Configure the frontend API URL to point to your local backend, then run:

```bash
npm start
```

The React application will normally be available at:

```text
http://localhost:3000
```

Make sure PostgreSQL is accessible and the backend database configuration is correct before starting the application.

## 📊 Performance Testing – Apache JMeter

Performance testing was conducted using Apache JMeter 5.6.3 against the deployed backend root endpoint.

**Test configuration:**

- Protocol: HTTPS
- Request Method: GET
- Endpoint: `/`
- Virtual users: 10, 50 and 100
- Loop count: 5

### Performance Results

| Metric | 10 Users | 50 Users | 100 Users |
|---|---:|---:|---:|
| Total Samples | 50 | 250 | 500 |
| Average Response Time | 330 ms | 187 ms | 221 ms |
| 95th Percentile | 443 ms | 279 ms | 392 ms |
| Error Rate | 0% | 0% | 0% |
| Throughput | ~5 req/sec | ~5 req/sec | ~5 req/sec |

**Observation:**

The final test runs recorded zero errors across all three load levels. Response time, throughput and percentile latency were used to evaluate backend performance.

**Testing Limitation:** These tests were performed only on the basic backend root endpoint (`GET /`). They do not represent the performance of complete customer workflows such as order placement or payment processing, and they do not establish the maximum capacity of the application.

## 📚 Distributed and Cloud Computing Concepts

This project demonstrates several concepts covered in the Distributed and Cloud Computing course:

- **Three-Tier Architecture:** Separation of presentation, application and data layers.
- **Client-Server Model:** Clients communicate with a central backend server.
- **Inter-Process Communication (IPC):** REST APIs enable communication between frontend and backend.
- **Concurrency:** The backend handles multiple incoming requests.
- **Database Transactions:** Selected operations use `BEGIN`, `COMMIT` and `ROLLBACK` to maintain data consistency.
- **Authentication and Security:** Password hashing and JWT-based authentication.
- **Public Cloud Computing:** Application components are deployed on cloud platforms.
- **Performance Evaluation:** Apache JMeter is used to measure response time, throughput and error rate.

## 🚀 Future Enhancements

- Implement automated scaling and load balancing.
- Add caching to improve response times.
- Introduce monitoring and logging for production analysis.
- Perform load testing on complete application workflows.
- Explore containerization using Docker.
- Explore microservices architecture for independently scalable services.

## 👨‍💻 Author

**Manan Patel**

- Roll Number: 205226014
- Programme: M.Tech – Data Analytics
- Institution: National Institute of Technology, Tiruchirappalli

## 📄 Academic Context

**Course:** Distributed and Cloud Computing  
**Course Code:** CA6B1

This project was developed as part of the academic work to apply distributed computing, cloud deployment and performance evaluation concepts in a practical application.
