/**
 * CloudGuard Frontend API Client
 * Integrated with Express Backend
 */

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

function getAuthHeaders() {
    const token = localStorage.getItem("cloudguard_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

/**
 * 1. Login
 * POST /api/login
 */
export async function login(email, password) {
    if (!email || !password) {
        throw new Error("Email and password are required.");
    }

    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed. Please check your credentials.");
    }

    if (data.token) {
        localStorage.setItem("cloudguard_token", data.token);
    }
    if (data.user) {
        localStorage.setItem("cloudguard_user", JSON.stringify(data.user));
    }

    return {
        success: true,
        user: data.user,
        token: data.token,
    };
}

/**
 * 2. Get Dashboard Stats
 * GET /api/dashboard
 */
export async function getDashboard() {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load dashboard data.");
    }

    const res = await response.json();
    return res.data || res;
}

/**
 * 3. Start Cloud Security Scan
 * POST /api/scans
 */
export async function startScan(config = {}) {
    const response = await fetch(`${API_BASE_URL}/scans`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to start security scan.");
    }

    const data = await response.json();
    return {
        success: true,
        scanId: data.scanId || (data.data && data.data.scanId),
        status: data.status || (data.data && data.data.status) || "completed",
        config,
    };
}

/**
 * 4. Get Scan Status
 * GET /api/scans/:id/status
 */
export async function getScanStatus(scanId) {
    const response = await fetch(`${API_BASE_URL}/scans/${scanId}/status`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch status for scan ${scanId}`);
    }

    const data = await response.json();
    return data.data || data;
}

/**
 * 5. Get Security Findings
 * GET /api/findings
 */
export async function getFindings(filters = {}) {
    const params = new URLSearchParams();
    if (filters.severity && filters.severity !== "All") {
        params.append("severity", filters.severity);
    }
    if (filters.search) {
        params.append("search", filters.search);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_BASE_URL}/findings${query}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load findings.");
    }

    const data = await response.json();
    return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
}

/**
 * 6. Get Finding Details
 * GET /api/findings/:id
 */
export async function getFindingDetails(id) {
    const response = await fetch(`${API_BASE_URL}/findings/${id}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load details for finding ${id}`);
    }

    const data = await response.json();
    return data.data || data;
}

/**
 * 7. Get Reports
 * GET /api/reports
 */
export async function getReports() {
    const response = await fetch(`${API_BASE_URL}/reports`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load reports.");
    }

    const data = await response.json();
    return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
}

/**
 * 8. Get Gemini Security Explanation
 * POST /api/findings/:id/explanation
 */
export async function getGeminiExplanation(finding) {
    const id = typeof finding === "object" ? finding.id : finding;
    const body = typeof finding === "object" ? finding : { id };

    const response = await fetch(`${API_BASE_URL}/findings/${id}/explanation`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate AI explanation.");
    }

    const data = await response.json();
    return {
        explanation: data.explanation || (data.data && data.data.summary) || "",
        recommendation: data.recommendation || (data.data && data.data.remediationSteps && data.data.remediationSteps.join(" ")) || "",
    };
}

/**
 * 9. Download Report PDF
 * GET /api/reports/:id/pdf
 */
export async function downloadReportPdf(reportId, reportName) {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/pdf`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download PDF report.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedName = (reportName || `CloudGuard-Report-${reportId}`)
        .replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `${sanitizedName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}