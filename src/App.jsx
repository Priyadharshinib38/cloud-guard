import React, { useState } from "react";

import {
    login,
    getDashboard,
    startScan,
    getFindings,
    getFindingDetails,
    getReports,
    getGeminiExplanation,
} from "./api";

const initialFindings = [
    {
        id: 1,
        title: "Public S3 Bucket",
        severity: "Critical",
        service: "Amazon S3",
        description:
            "A storage bucket is publicly accessible and may expose sensitive data.",
    },
    {
        id: 2,
        title: "Open Security Group Port",
        severity: "High",
        service: "EC2",
        description:
            "Port 22 is open to the public internet and may allow unauthorized access.",
    },
    {
        id: 3,
        title: "Missing Encryption",
        severity: "Medium",
        service: "RDS",
        description:
            "Database encryption is not enabled for the affected resource.",
    },
    {
        id: 4,
        title: "Unused IAM Permission",
        severity: "Low",
        service: "IAM",
        description:
            "An IAM role contains permissions that may not be required.",
    },
];

function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);

    const [dashboard, setDashboard] = useState(null);
    const [findings, setFindings] = useState([]);
    const [reports, setReports] = useState([]);

    const [selectedFinding, setSelectedFinding] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("All");

    const [scanProvider, setScanProvider] = useState("AWS");
    const [scanStatus, setScanStatus] = useState("idle");
    const [scanResult, setScanResult] = useState(null);

    const [aiExplanation, setAiExplanation] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    function getAuthToken() {
        const keys = [
            "token",
            "authToken",
            "accessToken",
            "cloudguard_token",
            "cloudguardToken",
        ];

        for (const key of keys) {
            const value = localStorage.getItem(key);

            if (value) {
                return value;
            }
        }

        return null;
    }

    async function loadDashboard() {
        try {
            setLoading(true);
            setError("");

            const data = await getDashboard();

            setDashboard(data);
        } catch (err) {
            setError(
                err.message || "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }

    async function loadFindings() {
        try {
            setLoading(true);
            setError("");

            const data = await getFindings();

            setFindings(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            setError(
                err.message || "Unable to load findings."
            );
        } finally {
            setLoading(false);
        }
    }

    async function loadReports() {
        try {
            setLoading(true);
            setError("");

            const data = await getReports();

            setReports(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            setError(
                err.message || "Unable to load reports."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(
            e.currentTarget
        );

        const email = formData.get("email");
        const password = formData.get("password");

        try {
            setLoading(true);
            setError("");

            const result = await login(
                email,
                password
            );

            if (!result || !result.success) {
                throw new Error(
                    result?.message || "Login failed."
                );
            }

            setUser(
                result.user || {
                    name: "Admin",
                    email: email,
                }
            );

            if (result.token) {
                localStorage.setItem(
                    "token",
                    result.token
                );
            }

            if (result.accessToken) {
                localStorage.setItem(
                    "accessToken",
                    result.accessToken
                );
            }

            setPage("dashboard");

            await loadDashboard();
        } catch (err) {
            setError(
                err.message || "Login failed."
            );
        } finally {
            setLoading(false);
        }
    }

    function navigate(nextPage) {
        setPage(nextPage);
        setError("");

        if (nextPage === "dashboard") {
            loadDashboard();
        }

        if (nextPage === "findings") {
            loadFindings();
        }

        if (nextPage === "reports") {
            loadReports();
        }
    }

    function handleLogout() {
        setUser(null);
        setDashboard(null);
        setFindings([]);
        setReports([]);
        setSelectedFinding(null);

        setPage("login");
        setError("");

        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem(
            "cloudguard_token"
        );
        localStorage.removeItem(
            "cloudguardToken"
        );
    }

    async function handleStartScan() {
        try {
            setScanStatus("scanning");
            setScanResult(null);
            setError("");

            const result = await startScan({
                provider: scanProvider,
            });

            setScanResult(result);
            setScanStatus("completed");

            await loadDashboard();
        } catch (err) {
            setScanStatus("error");

            setError(
                err.message ||
                "Scan failed. Please try again."
            );
        }
    }

    async function openFinding(finding) {
        try {
            setLoading(true);
            setError("");

            const details =
                await getFindingDetails(
                    finding.id
                );

            setSelectedFinding({
                ...finding,
                ...details,
            });

            setAiExplanation(null);

            setPage("finding-details");
        } catch (err) {
            setError(
                err.message ||
                "Unable to load finding details."
            );
        } finally {
            setLoading(false);
        }
    }

    async function generateAIExplanation() {
        if (!selectedFinding) {
            return;
        }

        try {
            setAiLoading(true);
            setError("");

            const result =
                await getGeminiExplanation(
                    selectedFinding
                );

            setAiExplanation(result);
        } catch (err) {
            setError(
                err.message ||
                "Unable to generate AI explanation."
            );
        } finally {
            setAiLoading(false);
        }
    }

    async function handleDownloadReport(report) {
        try {
            setError("");

            if (!report || !report.id) {
                throw new Error(
                    "Report ID is missing."
                );
            }

            const token = getAuthToken();

            const headers = {};

            if (token) {
                headers.Authorization =
                    `Bearer ${token}`;
            }

            const response = await fetch(
                `http://localhost:5000/api/reports/${report.id}/download`,
                {
                    method: "GET",
                    headers: headers,
                }
            );

            if (!response.ok) {
                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    throw new Error(
                        "Authentication required. Please login again."
                    );
                }

                throw new Error(
                    `Report download failed with status ${response.status}.`
                );
            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement("a");

            link.href = url;

            const fileName = (
                report.name ||
                "CloudGuard-Security-Report"
            ).replace(
                /[^a-z0-9-_]/gi,
                "_"
            );

            link.download =
                `${fileName}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(
                "Report download failed:",
                err
            );

            setError(
                err.message ||
                "Report download failed."
            );
        }
    }

    const filteredFindings =
        findings.filter((finding) => {
            const matchesSeverity =
                severityFilter === "All" ||
                finding.severity ===
                severityFilter;

            const searchText =
                search.toLowerCase();

            const matchesSearch =
                String(
                    finding.title || ""
                )
                    .toLowerCase()
                    .includes(searchText) ||
                String(
                    finding.service || ""
                )
                    .toLowerCase()
                    .includes(searchText) ||
                String(
                    finding.description || ""
                )
                    .toLowerCase()
                    .includes(searchText);

            return (
                matchesSeverity &&
                matchesSearch
            );
        });

    if (page === "login") {
        return (
            <div className="login-page">
                <div className="login-card">

                    <div className="brand-logo">
                        CG
                    </div>

                    <h1>CloudGuard</h1>

                    <p className="login-subtitle">
                        Cloud Security Scanner
                    </p>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleLogin}
                    >
                        <label>
                            Email
                        </label>

                        <input
                            name="email"
                            type="email"
                            placeholder="admin@cloudguard.com"
                            defaultValue="admin@cloudguard.com"
                            required
                        />

                        <label>
                            Password
                        </label>

                        <input
                            name="password"
                            type="password"
                            placeholder="Enter password"
                            defaultValue="password"
                            required
                        />

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing in..."
                                : "Login"}
                        </button>
                    </form>

                    <p className="demo-text">
                        Demo credentials can be any
                        valid email and password.
                    </p>

                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">

            <aside className="sidebar">

                <div className="sidebar-brand">

                    <div className="brand-logo small">
                        CG
                    </div>

                    <div>
                        <h2>CloudGuard</h2>
                        <span>
                            Security Platform
                        </span>
                    </div>

                </div>

                <nav className="sidebar-nav">

                    <button
                        className={
                            page === "dashboard"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate("dashboard")
                        }
                    >
                        <span>▦</span>
                        Dashboard
                    </button>

                    <button
                        className={
                            page === "scan"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate("scan")
                        }
                    >
                        <span>⌁</span>
                        Scan
                    </button>

                    <button
                        className={
                            page === "findings" ||
                                page ===
                                "finding-details"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate("findings")
                        }
                    >
                        <span>⚠</span>
                        Findings
                    </button>

                    <button
                        className={
                            page === "reports"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate("reports")
                        }
                    >
                        <span>▤</span>
                        Reports
                    </button>

                </nav>

                <div className="sidebar-bottom">

                    <div className="user-mini">

                        <div className="avatar">
                            {user?.name?.charAt(0) ||
                                "A"}
                        </div>

                        <div>
                            <strong>
                                {user?.name ||
                                    "Admin"}
                            </strong>

                            <span>
                                {user?.email ||
                                    "admin"}
                            </span>
                        </div>

                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </aside>

            <main className="main-content">

                {error && (
                    <div className="global-error">

                        <span>
                            {error}
                        </span>

                        <button
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>

                    </div>
                )}

                {page === "dashboard" && (
                    <>
                        <div className="page-header">

                            <div>
                                <h1>
                                    Dashboard
                                </h1>

                                <p>
                                    Monitor your cloud
                                    security posture.
                                </p>
                            </div>

                            <button
                                className="primary-button"
                                onClick={() =>
                                    navigate("scan")
                                }
                            >
                                + Start New Scan
                            </button>

                        </div>

                        {loading &&
                            !dashboard ? (
                            <div className="loading-card">
                                Loading dashboard...
                            </div>
                        ) : dashboard ? (
                            <>
                                <div className="stats-grid">

                                    <div className="stat-card">

                                        <div className="stat-icon blue">
                                            ◉
                                        </div>

                                        <div>
                                            <span>
                                                Total Scans
                                            </span>

                                            <strong>
                                                {dashboard.totalScans ??
                                                    0}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="stat-card">

                                        <div className="stat-icon red">
                                            !
                                        </div>

                                        <div>
                                            <span>
                                                Critical
                                            </span>

                                            <strong>
                                                {dashboard.critical ??
                                                    0}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="stat-card">

                                        <div className="stat-icon orange">
                                            !
                                        </div>

                                        <div>
                                            <span>
                                                High
                                            </span>

                                            <strong>
                                                {dashboard.high ??
                                                    0}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="stat-card">

                                        <div className="stat-icon purple">
                                            ✓
                                        </div>

                                        <div>
                                            <span>
                                                Security Score
                                            </span>

                                            <strong>
                                                {dashboard.securityScore ??
                                                    0}
                                                %
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                <div className="dashboard-grid">

                                    <section className="panel security-score-panel">

                                        <div className="panel-header">

                                            <div>
                                                <h2>
                                                    Security
                                                    Overview
                                                </h2>

                                                <p>
                                                    Current cloud
                                                    security posture
                                                </p>
                                            </div>

                                        </div>

                                        <div className="score-content">

                                            <div className="score-circle">

                                                <strong>
                                                    {dashboard.securityScore ??
                                                        0}
                                                </strong>

                                                <span>
                                                    /100
                                                </span>

                                            </div>

                                            <div className="score-info">

                                                <h3>
                                                    Security Score
                                                </h3>

                                                <p>
                                                    Your cloud
                                                    environment has
                                                    several security
                                                    findings that
                                                    should be
                                                    reviewed.
                                                </p>

                                                <button
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        navigate(
                                                            "findings"
                                                        )
                                                    }
                                                >
                                                    View Findings
                                                </button>

                                            </div>

                                        </div>

                                    </section>

                                    <section className="panel">

                                        <div className="panel-header">

                                            <div>
                                                <h2>
                                                    Severity Summary
                                                </h2>

                                                <p>
                                                    Findings by severity
                                                </p>
                                            </div>

                                        </div>

                                        <div className="severity-summary">

                                            <div>
                                                <span className="severity-dot critical" />
                                                <span>
                                                    Critical
                                                </span>
                                                <strong>
                                                    {dashboard.critical ??
                                                        0}
                                                </strong>
                                            </div>

                                            <div>
                                                <span className="severity-dot high" />
                                                <span>
                                                    High
                                                </span>
                                                <strong>
                                                    {dashboard.high ??
                                                        0}
                                                </strong>
                                            </div>

                                            <div>
                                                <span className="severity-dot medium" />
                                                <span>
                                                    Medium
                                                </span>
                                                <strong>
                                                    {dashboard.medium ??
                                                        0}
                                                </strong>
                                            </div>

                                            <div>
                                                <span className="severity-dot low" />
                                                <span>
                                                    Low
                                                </span>
                                                <strong>
                                                    {dashboard.low ??
                                                        0}
                                                </strong>
                                            </div>

                                        </div>

                                    </section>

                                </div>

                                <section className="panel recent-panel">

                                    <div className="panel-header">

                                        <div>
                                            <h2>
                                                Recent Findings
                                            </h2>

                                            <p>
                                                Latest detected
                                                security issues
                                            </p>
                                        </div>

                                        <button
                                            className="text-button"
                                            onClick={() =>
                                                navigate(
                                                    "findings"
                                                )
                                            }
                                        >
                                            View all →
                                        </button>

                                    </div>

                                    <div className="finding-list">

                                        {initialFindings
                                            .slice(0, 3)
                                            .map((finding) => (
                                                <div
                                                    className="finding-row"
                                                    key={finding.id}
                                                >

                                                    <div>
                                                        <h3>
                                                            {finding.title}
                                                        </h3>

                                                        <span>
                                                            {finding.service}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`severity-badge ${finding.severity.toLowerCase()}`}
                                                    >
                                                        {finding.severity}
                                                    </span>

                                                </div>
                                            ))}

                                    </div>

                                </section>

                            </>
                        ) : (
                            <div className="empty-state">
                                No dashboard data available.
                            </div>
                        )}

                    </>
                )}

                {page === "scan" && (
                    <>
                        <div className="page-header">

                            <div>
                                <h1>
                                    Cloud Scan
                                </h1>

                                <p>
                                    Scan your cloud
                                    environment for
                                    security issues.
                                </p>
                            </div>

                        </div>

                        <section className="panel scan-panel">

                            <div className="scan-icon">
                                ⌁
                            </div>

                            <h2>
                                Start Security Scan
                            </h2>

                            <p>
                                Select your cloud
                                provider and start a
                                security configuration
                                scan.
                            </p>

                            <div className="form-group">

                                <label>
                                    Cloud Provider
                                </label>

                                <select
                                    value={scanProvider}
                                    onChange={(e) =>
                                        setScanProvider(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        scanStatus ===
                                        "scanning"
                                    }
                                >
                                    <option value="AWS">
                                        Amazon Web Services
                                        (AWS)
                                    </option>

                                    <option value="Azure">
                                        Microsoft Azure
                                    </option>

                                    <option value="GCP">
                                        Google Cloud
                                        Platform
                                    </option>
                                </select>

                            </div>

                            <button
                                className="primary-button scan-button"
                                onClick={
                                    handleStartScan
                                }
                                disabled={
                                    scanStatus ===
                                    "scanning"
                                }
                            >
                                {scanStatus ===
                                    "scanning"
                                    ? "Scanning..."
                                    : "Start Scan"}
                            </button>

                            {scanStatus ===
                                "scanning" && (
                                    <div className="scan-status scanning">

                                        <div className="spinner" />

                                        <div>
                                            <strong>
                                                Scan in progress
                                            </strong>

                                            <span>
                                                Checking cloud
                                                configuration...
                                            </span>
                                        </div>

                                    </div>
                                )}

                            {scanStatus ===
                                "completed" &&
                                scanResult && (
                                    <div className="scan-status success">

                                        <div className="status-check">
                                            ✓
                                        </div>

                                        <div>
                                            <strong>
                                                Scan completed
                                                successfully
                                            </strong>

                                            <span>
                                                Scan ID:{" "}
                                                {scanResult.scanId ||
                                                    scanResult.id ||
                                                    "completed"}
                                            </span>
                                        </div>

                                    </div>
                                )}

                            {scanStatus ===
                                "error" && (
                                    <div className="scan-status failed">

                                        <div className="status-check">
                                            !
                                        </div>

                                        <div>
                                            <strong>
                                                Scan failed
                                            </strong>

                                            <span>
                                                Please try again.
                                            </span>
                                        </div>

                                    </div>
                                )}

                        </section>
                    </>
                )}

                {page === "findings" && (
                    <>
                        <div className="page-header">

                            <div>
                                <h1>
                                    Security Findings
                                </h1>

                                <p>
                                    Review detected cloud
                                    security issues.
                                </p>
                            </div>

                        </div>

                        <section className="panel">

                            <div className="findings-toolbar">

                                <div className="search-box">

                                    <span>
                                        ⌕
                                    </span>

                                    <input
                                        type="text"
                                        placeholder="Search findings..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <select
                                    value={
                                        severityFilter
                                    }
                                    onChange={(e) =>
                                        setSeverityFilter(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="All">
                                        All Severities
                                    </option>

                                    <option value="Critical">
                                        Critical
                                    </option>

                                    <option value="High">
                                        High
                                    </option>

                                    <option value="Medium">
                                        Medium
                                    </option>

                                    <option value="Low">
                                        Low
                                    </option>

                                </select>

                            </div>

                            {loading ? (
                                <div className="loading-card">
                                    Loading findings...
                                </div>
                            ) : filteredFindings.length ===
                                0 ? (
                                <div className="empty-state">

                                    <h3>
                                        No findings found
                                    </h3>

                                    <p>
                                        Try changing your
                                        search or severity
                                        filter.
                                    </p>

                                </div>
                            ) : (
                                <div className="findings-grid">

                                    {filteredFindings.map(
                                        (finding) => (
                                            <div
                                                className="finding-card"
                                                key={finding.id}
                                                onClick={() =>
                                                    openFinding(
                                                        finding
                                                    )
                                                }
                                            >

                                                <div className="finding-card-top">

                                                    <span
                                                        className={`severity-badge ${String(
                                                            finding.severity || ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {finding.severity}
                                                    </span>

                                                    <span className="finding-service">
                                                        {finding.service}
                                                    </span>

                                                </div>

                                                <h3>
                                                    {finding.title}
                                                </h3>

                                                <p>
                                                    {finding.description}
                                                </p>

                                                <button
                                                    className="view-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        openFinding(
                                                            finding
                                                        );
                                                    }}
                                                >
                                                    View Details →
                                                </button>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                        </section>
                    </>
                )}

                {page ===
                    "finding-details" &&
                    selectedFinding && (
                        <>
                            <div className="page-header">

                                <div>

                                    <button
                                        className="back-button"
                                        onClick={() =>
                                            navigate(
                                                "findings"
                                            )
                                        }
                                    >
                                        ← Back to Findings
                                    </button>

                                    <h1>
                                        {
                                            selectedFinding.title
                                        }
                                    </h1>

                                    <p>
                                        {
                                            selectedFinding.service
                                        }{" "}
                                        security finding
                                    </p>

                                </div>

                                <span
                                    className={`severity-badge large ${String(
                                        selectedFinding.severity ||
                                        ""
                                    ).toLowerCase()}`}
                                >
                                    {
                                        selectedFinding.severity
                                    }
                                </span>

                            </div>

                            <div className="details-grid">

                                <section className="panel">

                                    <div className="panel-header">

                                        <div>
                                            <h2>
                                                Finding Details
                                            </h2>

                                            <p>
                                                Security issue
                                                information
                                            </p>
                                        </div>

                                    </div>

                                    <div className="detail-section">

                                        <label>
                                            Description
                                        </label>

                                        <p>
                                            {
                                                selectedFinding.description
                                            }
                                        </p>

                                    </div>

                                    <div className="detail-section">

                                        <label>
                                            Security Explanation
                                        </label>

                                        <p>
                                            {selectedFinding.explanation ||
                                                "Review this configuration to determine whether it violates your security requirements."}
                                        </p>

                                    </div>

                                    <div className="detail-section">

                                        <label>
                                            Recommendation
                                        </label>

                                        <p>
                                            {selectedFinding.recommendation ||
                                                "Review the affected resource and apply appropriate security controls."}
                                        </p>

                                    </div>

                                </section>

                                <section className="panel ai-panel">

                                    <div className="ai-header">

                                        <div className="ai-icon">
                                            ✦
                                        </div>

                                        <div>
                                            <h2>
                                                AI Security
                                                Explanation
                                            </h2>

                                            <p>
                                                Gemini-powered
                                                security guidance
                                            </p>
                                        </div>

                                    </div>

                                    {!aiExplanation ? (
                                        <>
                                            <p className="ai-placeholder">
                                                Generate an
                                                AI-powered
                                                explanation of
                                                this finding and
                                                recommended
                                                remediation
                                                steps.
                                            </p>

                                            <button
                                                className="primary-button"
                                                onClick={
                                                    generateAIExplanation
                                                }
                                                disabled={
                                                    aiLoading
                                                }
                                            >
                                                {aiLoading
                                                    ? "Generating..."
                                                    : "Generate Explanation"}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="ai-result">

                                            <div className="ai-result-block">

                                                <label>
                                                    Explanation
                                                </label>

                                                <p>
                                                    {
                                                        aiExplanation.explanation
                                                    }
                                                </p>

                                            </div>

                                            <div className="ai-result-block">

                                                <label>
                                                    Recommendation
                                                </label>

                                                <p>
                                                    {
                                                        aiExplanation.recommendation
                                                    }
                                                </p>

                                            </div>

                                        </div>
                                    )}

                                </section>

                            </div>
                        </>
                    )}

                {page === "reports" && (
                    <>
                        <div className="page-header">

                            <div>
                                <h1>
                                    Reports
                                </h1>

                                <p>
                                    View and manage your
                                    security scan reports.
                                </p>
                            </div>

                        </div>

                        <section className="panel">

                            {loading ? (
                                <div className="loading-card">
                                    Loading reports...
                                </div>
                            ) : reports.length ===
                                0 ? (
                                <div className="empty-state">
                                    No reports available.
                                </div>
                            ) : (
                                <div className="reports-list">

                                    {reports.map(
                                        (report) => (
                                            <div
                                                className="report-card"
                                                key={report.id}
                                            >

                                                <div className="report-icon">
                                                    ▤
                                                </div>

                                                <div className="report-info">

                                                    <h3>
                                                        {report.name ||
                                                            `Report #${report.id}`}
                                                    </h3>

                                                    <p>
                                                        Generated on{" "}
                                                        {report.date ||
                                                            report.createdAt ||
                                                            "-"}
                                                    </p>

                                                </div>

                                                <span className="report-status">
                                                    {report.status ||
                                                        "Ready"}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        handleDownloadReport(
                                                            report
                                                        )
                                                    }
                                                >
                                                    Download Report
                                                </button>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                        </section>
                    </>
                )}

            </main>
        </div>
    );
}

export default App;