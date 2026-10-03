const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(email, password) {
    await delay(500);

    if (!email || !password) {
        throw new Error("Email and password are required.");
    }

    return {
        success: true,
        user: {
            name: "Admin",
            email,
        },
        token: "demo-token",
    };
}

export async function getDashboard() {
    await delay(500);

    return {
        totalScans: 24,
        critical: 3,
        high: 7,
        medium: 11,
        low: 4,
        securityScore: 72,
    };
}

export async function startScan(config) {
    await delay(1200);

    return {
        success: true,
        scanId: `SCAN-${Date.now()}`,
        status: "completed",
        config,
    };
}

export async function getFindings() {
    await delay(500);

    return [
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
}

export async function getFindingDetails(id) {
    await delay(400);

    return {
        id,
        explanation:
            "This configuration may increase the risk of unauthorized access to cloud resources.",
        recommendation:
            "Restrict public access, review permissions, and apply least-privilege security controls.",
    };
}

export async function getReports() {
    await delay(400);

    return [
        {
            id: 1,
            name: "CloudGuard Security Report",
            date: "03 Oct 2026",
            status: "Ready",
        },
        {
            id: 2,
            name: "AWS Infrastructure Scan",
            date: "01 Oct 2026",
            status: "Ready",
        },
    ];
}

export async function getGeminiExplanation(finding) {
    await delay(700);

    return {
        explanation: `AI analysis for "${finding.title}": this finding represents a potential security weakness in the ${finding.service} environment.`,
        recommendation:
            "Review the affected resource, restrict unnecessary access, and apply the recommended cloud security controls.",
    };
}