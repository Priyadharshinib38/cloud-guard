/**
 * CloudGuard - Centralized API Service Layer
 * 
 * INTEGRATION NOTE FOR PERSON 2 (BACKEND DEVELOPER):
 * - To connect live backend endpoints, change USE_MOCK to `false` or define VITE_API_URL in .env.
 * - All response structures here match FRONTEND_API_CONTRACT.md.
 * - Authentication uses Bearer Token authorization header stored in localStorage.
 */

import {
  mockCurrentUser,
  mockDashboard,
  mockFindings,
  mockReports
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = true; // Set to false when backend API is running

/**
 * Helper to simulate realistic async network delay for frontend testing
 */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to get authorization headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('cloudguard_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * 1. Login API
 * POST /api/auth/login
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { user, token }
 */
export async function login(credentials) {
  if (USE_MOCK) {
    await delay(500);
    const { email, password } = credentials || {};
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 4) {
      throw new Error('Invalid credentials. Password must be at least 4 characters.');
    }

    // Return mock session
    const mockToken = 'cg_jwt_mock_token_' + Date.now();
    const user = {
      ...mockCurrentUser,
      email: email
    };

    localStorage.setItem('cloudguard_token', mockToken);
    localStorage.setItem('cloudguard_user', JSON.stringify(user));

    return {
      success: true,
      token: mockToken,
      user
    };
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed. Please check your credentials.');
  }

  const data = await response.json();
  if (data.token) {
    localStorage.setItem('cloudguard_token', data.token);
    localStorage.setItem('cloudguard_user', JSON.stringify(data.user));
  }
  return data;
}

/**
 * 2. Get Dashboard Stats API
 * GET /api/dashboard
 * @returns {Promise<Object>} Dashboard overview metrics and recent findings
 */
export async function getDashboard() {
  if (USE_MOCK) {
    await delay(300);
    return {
      success: true,
      data: {
        ...mockDashboard,
        recentFindings: mockFindings.slice(0, 5)
      }
    };
  }

  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard metrics');
  }

  return response.json();
}

/**
 * 3. Start Cloud Security Scan API
 * POST /api/scans
 * @param {Object} scanConfig - { provider, environmentId, benchmarkProfile, customTags }
 * @returns {Promise<Object>} { scanId, status, estimatedTimeSeconds }
 */
export async function startScan(scanConfig) {
  if (USE_MOCK) {
    await delay(450);
    const scanId = `SCAN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    return {
      success: true,
      data: {
        scanId,
        status: 'In Progress',
        targetEnvironment: scanConfig.environmentId || 'AWS Production (us-east-1)',
        benchmarkProfile: scanConfig.benchmarkProfile || 'CIS Benchmark v1.4',
        startedAt: new Date().toISOString(),
        estimatedTimeSeconds: 15
      }
    };
  }

  const response = await fetch(`${API_BASE_URL}/scans`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(scanConfig)
  });

  if (!response.ok) {
    throw new Error('Failed to initiate cloud scan');
  }

  return response.json();
}

/**
 * 4. Get Scan Status API
 * GET /api/scans/:scanId/status
 * @param {string} scanId
 * @returns {Promise<Object>} Scan progress percentage, step, and results summary
 */
export async function getScanStatus(scanId) {
  if (USE_MOCK) {
    await delay(200);
    return {
      success: true,
      data: {
        scanId,
        status: 'In Progress',
        progressPercent: 65,
        currentStep: 'Evaluating CIS benchmarks and network security groups...',
        duration: '1m 12s',
        scannedResources: 48,
        findingsDiscovered: 4
      }
    };
  }

  const response = await fetch(`${API_BASE_URL}/scans/${scanId}/status`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to query scan status for ${scanId}`);
  }

  return response.json();
}

/**
 * 5. Get Findings API
 * GET /api/findings
 * @param {Object} filters - { severity, status, search, limit }
 * @returns {Promise<Object>} { findings, totalCount }
 */
export async function getFindings(filters = {}) {
  if (USE_MOCK) {
    await delay(350);
    let filtered = [...mockFindings];

    if (filters.severity && filters.severity !== 'All') {
      filtered = filtered.filter(
        (f) => f.severity.toLowerCase() === filters.severity.toLowerCase()
      );
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.affectedResource.toLowerCase().includes(q) ||
          f.ruleId.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(
        (f) => f.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    return {
      success: true,
      data: filtered,
      totalCount: filtered.length
    };
  }

  const queryParams = new URLSearchParams();
  if (filters.severity && filters.severity !== 'All') queryParams.append('severity', filters.severity);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.status && filters.status !== 'All') queryParams.append('status', filters.status);

  const url = `${API_BASE_URL}/findings?${queryParams.toString()}`;
  const response = await fetch(url, { headers: getAuthHeaders() });

  if (!response.ok) {
    throw new Error('Failed to retrieve security findings');
  }

  return response.json();
}

/**
 * 6. Get Finding Details API
 * GET /api/findings/:findingId
 * @param {string} findingId
 * @returns {Promise<Object>} Complete finding details
 */
export async function getFindingDetails(findingId) {
  if (USE_MOCK) {
    await delay(300);
    const finding = mockFindings.find((f) => f.id === findingId);
    if (!finding) {
      throw new Error(`Finding with ID ${findingId} not found`);
    }
    return {
      success: true,
      data: finding
    };
  }

  const response = await fetch(`${API_BASE_URL}/findings/${findingId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve details for finding ${findingId}`);
  }

  return response.json();
}

/**
 * 7. Get AI Security Explanation (Gemini) API
 * GET /api/findings/:findingId/ai-explanation
 * NOTE: Person 2 will connect this to Gemini on the backend.
 * @param {string} findingId
 * @returns {Promise<Object>} AI analysis, impact breakdown, and command-line remediation
 */
export async function getGeminiExplanation(findingId) {
  if (USE_MOCK) {
    await delay(400);
    const finding = mockFindings.find((f) => f.id === findingId);
    if (finding && finding.geminiExplanation) {
      return {
        success: true,
        data: finding.geminiExplanation
      };
    }
    return {
      success: true,
      data: {
        summary: "Automated Gemini security analysis evaluated this cloud resource against contemporary threat intelligence.",
        attackVector: "Unauthorized perimeter access or policy escalation via default permissions.",
        remediationSteps: [
          "1. Inspect active IAM policies and resource permissions.",
          "2. Apply least privilege access rules.",
          "3. Enable logging and monitoring."
        ],
        remediationCode: "# Run audit command\naws securityhub get-findings --filters '{\"Id\": [{\"Value\": \"" + findingId + "\", \"Comparison\": \"EQUALS\"}]}'",
        urgency: "Standard compliance remediation"
      }
    };
  }

  const response = await fetch(`${API_BASE_URL}/findings/${findingId}/ai-explanation`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Gemini security analysis from backend');
  }

  return response.json();
}

/**
 * 8. Get Reports API
 * GET /api/reports
 * @returns {Promise<Object>} List of compliance and audit reports
 */
export async function getReports() {
  if (USE_MOCK) {
    await delay(300);
    return {
      success: true,
      data: mockReports
    };
  }

  const response = await fetch(`${API_BASE_URL}/reports`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch security reports');
  }

  return response.json();
}

/**
 * User Logout
 */
export function logout() {
  localStorage.removeItem('cloudguard_token');
  localStorage.removeItem('cloudguard_user');
}

/**
 * Check existing authentication state
 */
export function getSavedSession() {
  const token = localStorage.getItem('cloudguard_token');
  const userStr = localStorage.getItem('cloudguard_user');
  if (token && userStr) {
    try {
      return { token, user: JSON.parse(userStr) };
    } catch {
      return null;
    }
  }
  return null;
}
