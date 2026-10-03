# CloudGuard - Backend Implementation Specification & Architecture Guide

## 1. Project Overview & Architecture
CloudGuard is a cloud security scanning platform built for auditing cloud configurations against security benchmarks (such as CIS benchmarks), identifying critical vulnerabilities across Amazon Web Services (AWS) resources (S3, EC2, RDS, IAM), aggregating security metrics, generating reports, and utilizing Google Gemini AI on the backend for explanation and remediation instructions.

### Architecture Layout
```
cloudguard/
├── backend/
│   ├── .env                    # Active local environment variables
│   ├── .env.example            # Environment configuration template
│   ├── .gitignore              # Ignores node_modules, .env, *.db
│   ├── package.json            # Express, SQLite, AWS SDK, Gemini SDK, JWT, Bcrypt
│   ├── test_api.js             # Automated API test suite covering 14 assertions
│   ├── data/
│   │   └── cloudguard.db       # Persistent SQLite database file
│   └── src/
│       ├── server.js           # Server startup (port 5000) & database init
│       ├── app.js              # Express app, CORS, JSON parsing, routes, error handling
│       ├── db/
│       │   └── database.js     # SQLite schema, tables, foreign keys, auto-seeding
│       ├── controllers/
│       │   ├── authController.js       # Login handling (POST /api/login)
│       │   ├── dashboardController.js  # Dynamic stats & security score computation
│       │   ├── scanController.js       # Scan creation & status checking
│       │   ├── findingsController.js   # Finding queries with search & severity filters
│       │   ├── geminiController.js     # Backend AI explanation generation
│       │   └── reportsController.js    # Security & compliance reports
│       ├── services/
│       │   ├── authService.js          # Password hashing (bcrypt) & JWT signing
│       │   ├── scannerService.js       # Cloud security scanner (AWS & simulated dev mode)
│       │   └── geminiService.js        # Google Generative AI integration with fallbacks
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── scanRoutes.js
│       │   ├── findingsRoutes.js
│       │   ├── reportsRoutes.js
│       │   └── index.js
│       └── middleware/
│           ├── authMiddleware.js       # JWT Bearer token verification
│           └── errorHandler.js        # Centralized HTTP error response handler
├── src/
│   ├── api.js                  # Frontend API client communicating with backend
│   ├── App.jsx                 # Preserved React frontend application
│   ├── index.css               # Styling
│   ├── main.jsx                # React DOM entry point
│   ├── context/
│   │   └── AuthContext.jsx     # Frontend authentication state
│   ├── components/
│   │   └── SeverityBadge.jsx   # Severity indicator component
│   └── services/
│       ├── api.js              # Centralized service layer (USE_MOCK = false)
│       └── mockData.js         # Reference datasets
├── API_DOCUMENTATION.md        # Complete API reference guide
├── BACKEND_IMPLEMENTATION.md   # This documentation file
└── vite.config.js              # Vite dev server configuration (port 5173)
```

---

## 2. Database Schema & Persistence

Built using Node.js built-in `node:sqlite` (`DatabaseSync`), requiring zero external database installations while providing full relational integrity, foreign keys, and atomic persistence.

### Tables:
1. **`users`**:
   - `id` (TEXT PRIMARY KEY)
   - `name` (TEXT)
   - `email` (TEXT UNIQUE)
   - `password` (TEXT - bcrypt hashed)
   - `createdAt` (TEXT)
   - *Default seed*: `admin@cloudguard.com` / `password`

2. **`scans`**:
   - `id` (TEXT PRIMARY KEY)
   - `provider` (TEXT - AWS/Azure/GCP)
   - `status` (TEXT - running/completed/failed)
   - `startedAt` (TEXT)
   - `completedAt` (TEXT)
   - `totalScanned` (INTEGER)

3. **`findings`**:
   - `id` (TEXT PRIMARY KEY)
   - `scanId` (TEXT, FOREIGN KEY references `scans(id)` ON DELETE CASCADE)
   - `title` (TEXT)
   - `severity` (TEXT - Critical, High, Medium, Low)
   - `service` (TEXT - Amazon S3, EC2, RDS, IAM)
   - `description` (TEXT)
   - `recommendation` (TEXT)
   - `affectedResource` (TEXT)
   - `ruleId` (TEXT)
   - `createdAt` (TEXT)

4. **`reports`**:
   - `id` (TEXT PRIMARY KEY)
   - `scanId` (TEXT, FOREIGN KEY references `scans(id)` ON DELETE SET NULL)
   - `name` (TEXT)
   - `status` (TEXT)
   - `date` (TEXT)
   - `createdAt` (TEXT)

---

## 3. Cloud Security Scanner Checks

The scanner service targets the following primary AWS configurations:
1. **Amazon S3**: Identifies buckets with disabled `PublicAccessBlock` or permissive ACL policies allowing public read/write (`CIS-AWS-2.1.5`). Produces **Critical** findings.
2. **Amazon EC2**: Audits Security Groups for inbound CIDR `0.0.0.0/0` on sensitive ports (port 22 SSH and port 3389 RDP) (`CIS-AWS-4.1`). Produces **High** or **Critical** findings.
3. **Amazon RDS**: Inspects relational database instances for missing KMS storage encryption at rest (`CIS-AWS-2.3.1`). Produces **Medium** findings.
4. **AWS IAM**: Checks for active Root account keys without Multi-Factor Authentication (MFA) or overly permissive wildcard statements (`CIS-AWS-1.5`, `CIS-AWS-1.16`). Produces **Low** or **Critical** findings.

### Dual-Mode Execution:
- **Live AWS Mode**: When `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are provided in `.env`, the scanner uses official AWS SDK clients (`@aws-sdk/client-s3`, `@aws-sdk/client-ec2`, `@aws-sdk/client-rds`, `@aws-sdk/client-iam`) to inspect active AWS infrastructure.
- **Safe Development Mode**: When AWS credentials are not configured, the scanner safely executes realistic simulated checks, ensuring developers and evaluators can run complete scans without AWS accounts or incurring cloud charges.

---

## 4. Google Gemini AI Integration

- **Route**: `POST /api/findings/:id/explanation` (and `GET /api/findings/:id/ai-explanation`)
- **Security**: The Gemini API key (`GEMINI_API_KEY`) is stored strictly in server-side environment variables and is never transmitted to the browser or frontend.
- **Prompt Engineering**: Instructs Gemini to analyze cloud finding metadata and output a JSON payload containing:
  - Concise threat analysis and attack vector
  - Step-by-step remediation instructions
  - Sample CLI remediation commands
- **Fail-Safe Fallbacks**: If `GEMINI_API_KEY` is not provided or API rate limits occur, the backend serves built-in threat intelligence matching the specific cloud service and severity, ensuring the user interface always receives a structured explanation.

---

## 5. Environment Variables

### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=cloudguard-dev-super-secret-jwt-key-2026
DATABASE_PATH=./data/cloudguard.db
GEMINI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
```

### Frontend (`.env` or Vite default):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 6. How to Run the Project

### Prerequisites
- Node.js (v18, v20, or v22+)
- npm

### 1. Run the Backend
```bash
cd backend
npm install
npm start
```
The backend starts at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### 2. Run the Frontend
```bash
# In the project root directory
npm install
npm run dev
```
The frontend starts at: `http://localhost:5173`

### 3. Log In to CloudGuard
Open `http://localhost:5173` in your browser.
- **Email**: `admin@cloudguard.com`
- **Password**: `password`

---

## 7. How to Run the Automated Test Suite

A complete test suite is included in `backend/test_api.js`:
```bash
cd backend
node test_api.js
```
This tests all 14 assertions:
1. Health check endpoint (`/api/health`)
2. Valid user login with JWT token issuance (`POST /api/login`)
3. Invalid password rejection (401)
4. Missing credentials rejection (400)
5. Dashboard metrics and dynamic score calculation (`GET /api/dashboard`)
6. Initiating cloud security scans (`POST /api/scans`)
7. Querying scan status (`GET /api/scans/:id/status`)
8. Retrieving security findings (`GET /api/findings`)
9. Filtering findings by severity (`GET /api/findings?severity=Critical`)
10. Searching findings by keyword (`GET /api/findings?search=bucket`)
11. Fetching finding details by ID (`GET /api/findings/:id`)
12. Generating Gemini AI security explanations (`POST /api/findings/:id/explanation`)
13. Retrieving compliance audit reports (`GET /api/reports`)
14. Catch-all 404 error handler
