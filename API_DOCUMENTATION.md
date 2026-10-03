# CloudGuard - API Documentation

Base URL: `http://localhost:5000/api`

This document provides a comprehensive reference for all CloudGuard REST API endpoints.

---

## 1. Authentication

### 1.1 User Login
Authenticates an administrator or security engineer and returns a JWT session token.

- **Method**: `POST`
- **URL**: `/api/login` (also aliased at `/api/auth/login`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "admin@cloudguard.com",
  "password": "password"
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-admin-01",
    "name": "Admin",
    "email": "admin@cloudguard.com"
  }
}
```

- **Error Responses**:
  - `400 Bad Request`:
    ```json
    { "success": false, "message": "Email and password are required." }
    ```
  - `401 Unauthorized`:
    ```json
    { "success": false, "message": "Invalid email or password." }
    ```

---

## 2. Dashboard

### 2.1 Get Security Posture Metrics
Computes and returns aggregate metrics calculated dynamically from scans and findings in the database.

- **Method**: `GET`
- **URL**: `/api/dashboard`
- **Headers**: `Authorization: Bearer <token>` (Optional)
- **Request Body**: None

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "totalScans": 3,
  "critical": 1,
  "high": 1,
  "medium": 1,
  "low": 1,
  "securityScore": 78,
  "recentFindings": [
    {
      "id": "FIND-001",
      "scanId": "SCAN-2026-094",
      "title": "Public S3 Bucket",
      "severity": "Critical",
      "service": "Amazon S3",
      "description": "A storage bucket is publicly accessible and may expose sensitive data.",
      "recommendation": "Enable S3 Block Public Access...",
      "affectedResource": "arn:aws:s3:::prod-customer-data-backup",
      "ruleId": "CIS-AWS-2.1.5",
      "createdAt": "2026-10-03T06:23:48.000Z"
    }
  ],
  "data": {
    "totalScans": 3,
    "critical": 1,
    "high": 1,
    "medium": 1,
    "low": 1,
    "securityScore": 78
  }
}
```

---

## 3. Scans

### 3.1 Initiate Cloud Security Scan
Triggers a configuration audit across cloud resources (AWS, Azure, or GCP). If AWS credentials are configured in `.env`, performs live AWS API checks; otherwise safely operates in development simulation mode.

- **Method**: `POST`
- **URL**: `/api/scans`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "provider": "AWS"
}
```

- **Success Response (201 Created)**:
```json
{
  "success": true,
  "scanId": "SCAN-2026-847",
  "status": "completed",
  "data": {
    "scanId": "SCAN-2026-847",
    "status": "completed",
    "provider": "AWS",
    "startedAt": "2026-10-03T06:30:00.000Z"
  }
}
```

- **Error Responses**:
  - `400 Bad Request`:
    ```json
    { "success": false, "message": "Invalid cloud provider 'Oracle'. Supported: AWS, Azure, GCP." }
    ```

---

### 3.2 Get Scan Status
Polls the execution state and details of a specific scan.

- **Method**: `GET`
- **URL**: `/api/scans/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: None

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "scanId": "SCAN-2026-847",
  "status": "completed",
  "data": {
    "scanId": "SCAN-2026-847",
    "status": "completed",
    "provider": "AWS",
    "startedAt": "2026-10-03T06:30:00.000Z",
    "completedAt": "2026-10-03T06:30:02.000Z",
    "totalScanned": 42
  }
}
```

- **Error Responses**:
  - `404 Not Found`:
    ```json
    { "success": false, "message": "Scan with ID 'SCAN-999' not found." }
    ```

---

## 4. Findings

### 4.1 Get All Findings (with Filters)
Retrieves cloud security findings from persistent storage with optional filtering by severity and full-text keyword search.

- **Method**: `GET`
- **URL**: `/api/findings`
- **Query Parameters**:
  - `severity` (Optional): Filter by `Critical`, `High`, `Medium`, `Low`, or `All`
  - `search` (Optional): Substring search across title, service, description, or resource identifier
- **Headers**: `Authorization: Bearer <token>`
- **Example Request**: `GET /api/findings?severity=Critical&search=bucket`

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "FIND-001",
      "scanId": "SCAN-2026-094",
      "title": "Public S3 Bucket",
      "severity": "Critical",
      "service": "Amazon S3",
      "description": "A storage bucket is publicly accessible and may expose sensitive data.",
      "recommendation": "Enable S3 Block Public Access at the bucket and account level. Restrict bucket ACL and policy permissions.",
      "affectedResource": "arn:aws:s3:::prod-customer-data-backup",
      "ruleId": "CIS-AWS-2.1.5",
      "createdAt": "2026-10-03T06:23:48.000Z"
    }
  ],
  "totalCount": 1
}
```

---

### 4.2 Get Finding Details
Fetches full contextual details for a specific finding by ID, including associated scan metadata.

- **Method**: `GET`
- **URL**: `/api/findings/:id`
- **Headers**: `Authorization: Bearer <token>`

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "id": "FIND-001",
  "scanId": "SCAN-2026-094",
  "title": "Public S3 Bucket",
  "severity": "Critical",
  "service": "Amazon S3",
  "description": "A storage bucket is publicly accessible and may expose sensitive data.",
  "recommendation": "Enable S3 Block Public Access at the bucket and account level.",
  "affectedResource": "arn:aws:s3:::prod-customer-data-backup",
  "ruleId": "CIS-AWS-2.1.5",
  "scanProvider": "AWS",
  "scanStartedAt": "2026-10-03T05:23:48.000Z",
  "createdAt": "2026-10-03T06:23:48.000Z"
}
```

- **Error Responses**:
  - `404 Not Found`:
    ```json
    { "success": false, "message": "Finding with ID 'FIND-999' not found." }
    ```

---

## 5. Gemini AI Security Explanations

### 5.1 Generate AI Finding Explanation & Remediation
Invokes Google Gemini AI strictly on the backend to evaluate the finding against contemporary threat models, providing risk explanation, attack vector analysis, and precise remediation CLI commands.

- **Method**: `POST` (also aliased as `GET /api/findings/:id/ai-explanation`)
- **URL**: `/api/findings/:id/explanation`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Request Body** (Optional, auto-loaded from database if omitted):
```json
{
  "title": "Public S3 Bucket",
  "severity": "Critical",
  "service": "Amazon S3",
  "description": "A storage bucket is publicly accessible and may expose sensitive data.",
  "affectedResource": "arn:aws:s3:::prod-customer-data-backup"
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "explanation": "The S3 bucket permits unrestricted public ingress, allowing unauthenticated actors to enumerate, read, or overwrite sensitive cloud storage objects. Public read access can lead to data exfiltration, while public write access allows arbitrary malware or ransomware injection.",
  "recommendation": "Enable 'Block Public Access' at both the account and bucket levels. Review bucket ACLs and remove any grants to 'AllUsers' or 'AuthenticatedUsers'. Enforce least-privilege bucket policies restricting access strictly to authorized IAM roles.",
  "data": {
    "summary": "The S3 bucket permits unrestricted public ingress...",
    "attackVector": "Exposed resource configurations, unauthenticated perimeter access, or policy escalation.",
    "remediationSteps": [
      "Enable 'Block Public Access' at both the account and bucket levels..."
    ],
    "remediationCode": "# Remediate via AWS CLI\naws securityhub get-findings --filters '{\"Id\": [{\"Value\": \"FIND-001\", \"Comparison\": \"EQUALS\"}]}'",
    "urgency": "Critical Priority Action"
  }
}
```

---

## 6. Reports

### 6.1 Get All Compliance & Scan Reports
Returns metadata for all finalized security posture audits and scan summaries.

- **Method**: `GET`
- **URL**: `/api/reports`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: None

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "REP-2026-001",
      "scanId": "SCAN-2026-094",
      "name": "CloudGuard Security Report",
      "status": "Ready",
      "date": "03 Oct 2026",
      "createdAt": "2026-10-03T06:23:48.000Z"
    },
    {
      "id": "REP-2026-002",
      "scanId": "SCAN-2026-094",
      "name": "AWS Infrastructure Scan",
      "status": "Ready",
      "date": "01 Oct 2026",
      "createdAt": "2026-10-01T06:23:48.000Z"
    }
  ]
}
```

---

## 7. System Health Check

### 7.1 Service Health
- **Method**: `GET`
- **URL**: `/api/health`
- **Response**:
```json
{
  "status": "ok",
  "uptime": 128.45,
  "timestamp": "2026-10-03T06:31:00.000Z",
  "service": "CloudGuard Security Backend"
}
```
