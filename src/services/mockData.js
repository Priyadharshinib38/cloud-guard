/**
 * CloudGuard - Centralized Development Mock Data
 * 
 * NOTE FOR PERSON 2 (BACKEND DEVELOPER):
 * These mock datasets mirror the expected JSON response payloads documented in FRONTEND_API_CONTRACT.md.
 * When the backend is ready, replace mock responses in `src/services/api.js` with live HTTP calls.
 */

export const mockCurrentUser = {
  id: "usr_cloudguard_01",
  name: "Alex Vance",
  email: "alex.vance@cloudguard.io",
  role: "Lead Cloud Security Architect",
  organization: "Enterprise Cloud Systems",
  avatarUrl: null
};

export const mockDashboard = {
  totalScans: 48,
  totalFindings: 142,
  criticalFindings: 12,
  highFindings: 28,
  mediumFindings: 45,
  lowFindings: 41,
  informationalFindings: 16,
  securityScore: 74, // Out of 100
  scoreGrade: "B",
  scoreStatus: "Needs Attention",
  scoreDelta: "+4% from last week",
  scannedResourcesCount: 312,
  complianceScore: {
    cis: 78,
    soc2: 84,
    pci: 71,
    nist: 80
  },
  latestScan: {
    id: "SCAN-2026-094",
    targetCloud: "AWS Production (us-east-1)",
    cloudProvider: "AWS",
    environment: "Production",
    timestamp: "2026-10-02T18:45:00Z",
    status: "Completed",
    duration: "3m 42s",
    rulesEvaluated: 284,
    resourcesScanned: 86,
    criticalCount: 3,
    highCount: 2,
    mediumCount: 2,
    lowCount: 1,
    infoCount: 1
  }
};

export const mockFindings = [
  {
    id: "FIND-001",
    title: "S3 Bucket Public Read/Write Access Enabled",
    severity: "Critical",
    affectedResource: "arn:aws:s3:::prod-customer-data-backup",
    resourceType: "AWS S3",
    cloudProvider: "AWS",
    region: "us-east-1",
    description: "The S3 bucket policy and Access Control List (ACL) permit unrestricted public READ and WRITE permissions, exposing sensitive database backup artifacts to the public internet.",
    securityImpact: "Unauthenticated attackers can exfiltrate customer PII and database snapshots, or inject ransomware and malicious payloads directly into cloud storage.",
    recommendation: "Enable S3 Block Public Access at bucket and account level. Restrict bucket policy to IAM roles using least-privilege IAM statements.",
    ruleId: "CIS-AWS-2.1.5",
    scanId: "SCAN-2026-094",
    status: "Open",
    discoveredAt: "2026-10-02T18:46:12Z",
    compliance: ["CIS Benchmark v1.4", "SOC 2 Type II CC6.1", "PCI-DSS 3.4"],
    geminiExplanation: {
      summary: "This is a critical misconfiguration exposing primary storage backups to arbitrary web traffic without authentication.",
      attackVector: "Automated internet scanners (e.g. Shodan, GrayhatWarfare) actively index public buckets. An attacker can download SQL dump files within minutes of public exposure.",
      remediationSteps: [
        "1. Open the Amazon S3 console at https://console.aws.amazon.com/s3/",
        "2. Select bucket 'prod-customer-data-backup' and choose 'Permissions'.",
        "3. Under 'Block public access (bucket settings)', click 'Edit'.",
        "4. Check 'Block all public access' and confirm changes.",
        "5. Review Bucket Policy and remove any Principal '*' statements."
      ],
      remediationCode: "aws s3api put-public-access-block \\\n  --bucket prod-customer-data-backup \\\n  --public-access-block-configuration \"BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true\"",
      urgency: "Immediate action required (Within 1 hour)"
    }
  },
  {
    id: "FIND-002",
    title: "Security Group Inbound Rule Allows SSH (Port 22) from 0.0.0.0/0",
    severity: "Critical",
    affectedResource: "sg-0a81b9921c (prod-bastion-sg)",
    resourceType: "AWS Security Group",
    cloudProvider: "AWS",
    region: "us-east-1",
    description: "Security group rule allows inbound TCP traffic on port 22 (SSH) from all IP addresses globally (0.0.0.0/0) without restriction or VPN requirement.",
    securityImpact: "Exposes administrative bastion instances to automated SSH brute-force attacks, credential stuffing, and zero-day OpenSSH vulnerabilities.",
    recommendation: "Restrict port 22 access exclusively to internal corporate CIDR blocks or migrate to AWS Systems Manager Session Manager for credential-less tunneling.",
    ruleId: "CIS-AWS-4.1",
    scanId: "SCAN-2026-094",
    status: "Open",
    discoveredAt: "2026-10-02T18:47:04Z",
    compliance: ["CIS Benchmark v1.4", "ISO 27001 A.13.1.2"],
    geminiExplanation: {
      summary: "Public SSH access significantly increases brute force and unauthorized access risk on core infrastructure.",
      attackVector: "Botnets constantly probe port 22 across public cloud IP ranges. Any weak password, leaked key, or SSH protocol bug yields instant shell access.",
      remediationSteps: [
        "1. Open the Amazon EC2 console at https://console.aws.amazon.com/ec2/",
        "2. In the navigation pane, choose 'Security Groups' and select 'sg-0a81b9921c'.",
        "3. Choose the 'Inbound rules' tab and click 'Edit inbound rules'.",
        "4. Locate the rule with Port 22 and Source 0.0.0.0/0.",
        "5. Delete the rule or restrict Source to your company office CIDR."
      ],
      remediationCode: "aws ec2 revoke-security-group-ingress \\\n  --group-id sg-0a81b9921c \\\n  --protocol tcp \\\n  --port 22 \\\n  --cidr 0.0.0.0/0",
      urgency: "High priority remediation (Within 4 hours)"
    }
  },
  {
    id: "FIND-003",
    title: "IAM Root Account Has Active Access Keys Without MFA",
    severity: "Critical",
    affectedResource: "arn:aws:iam::892138947192:root",
    resourceType: "AWS IAM",
    cloudProvider: "AWS",
    region: "global",
    description: "The AWS account root user possesses active programmatic API access keys and does not have hardware or virtual Multi-Factor Authentication enabled.",
    securityImpact: "Complete cloud account takeover. If root credentials leak, the attacker gains unrestricted control over all cloud regions, billing, and resources.",
    recommendation: "Delete all programmatic access keys for the root account immediately. Activate hardware MFA and delegate administrative duties via AWS IAM Identity Center (SSO).",
    ruleId: "CIS-AWS-1.12",
    scanId: "SCAN-2026-094",
    status: "Open",
    discoveredAt: "2026-10-02T18:47:33Z",
    compliance: ["CIS Benchmark v1.4", "NIST SP 800-53 AC-2", "HIPAA §164.312"],
    geminiExplanation: {
      summary: "Root accounts should never have static access keys under any operational circumstance.",
      attackVector: "Accidental commit of root keys to Git repositories or developer machines allows attackers to immediately spin up cryptominers or delete all cloud assets.",
      remediationSteps: [
        "1. Sign in as the root user at https://aws.amazon.com/",
        "2. Navigate to 'My Security Credentials'.",
        "3. Under 'Access keys', locate the active key and click 'Deactivate', then 'Delete'.",
        "4. Under 'Multi-factor authentication (MFA)', assign a FIDO2 security key or authenticator app."
      ],
      remediationCode: "aws iam delete-access-key \\\n  --access-key-id AKIAIOSFODNN7EXAMPLE \\\n  --user-name root",
      urgency: "Immediate action required"
    }
  },
  {
    id: "FIND-004",
    title: "EBS Volumes Lack Default Customer-Managed KMS Encryption",
    severity: "High",
    affectedResource: "vol-0f3319028e (prod-db-volume)",
    resourceType: "AWS EBS",
    cloudProvider: "AWS",
    region: "us-east-1",
    description: "Elastic Block Store volume containing relational database data is not encrypted at rest using a dedicated KMS Key with customer key rotation.",
    securityImpact: "Data at rest is susceptible to regulatory non-compliance fines and unauthorized snapshot inspection if volume snapshots are detached or shared.",
    recommendation: "Enable default EBS encryption for the AWS region and copy unencrypted volume snapshots to encrypted volumes before mounting.",
    ruleId: "CIS-AWS-2.2.1",
    scanId: "SCAN-2026-094",
    status: "In Review",
    discoveredAt: "2026-10-02T18:48:10Z",
    compliance: ["SOC 2 CC6.1", "PCI-DSS 3.4"],
    geminiExplanation: {
      summary: "Unencrypted storage volumes fail standard regulatory checks and expose snapshot data.",
      attackVector: "A misconfigured snapshot sharing policy could allow external accounts to restore unencrypted volume data without cryptographic barriers.",
      remediationSteps: [
        "1. Open EC2 settings and toggle 'Always encrypt new EBS volumes'.",
        "2. Create a snapshot of 'vol-0f3319028e'.",
        "3. Copy the snapshot with KMS encryption enabled.",
        "4. Create a new volume from the encrypted snapshot and attach to instance."
      ],
      remediationCode: "aws ec2 enable-ebs-encryption-by-default --region us-east-1",
      urgency: "Medium priority (Remediate this sprint)"
    }
  },
  {
    id: "FIND-005",
    title: "Kubernetes API Server Publicly Accessible Without IP Whitelisting",
    severity: "High",
    affectedResource: "arn:aws:eks:us-east-1:892138947192:cluster/prod-k8s-cluster",
    resourceType: "AWS EKS",
    cloudProvider: "AWS",
    region: "us-east-1",
    description: "EKS Cluster endpoint access is configured with public access enabled and no CIDR IP whitelist restrictions.",
    securityImpact: "Kubernetes API control plane is exposed to unauthorized reconnaissance and zero-day vulnerabilities in the Kubernetes control plane software.",
    recommendation: "Configure EKS cluster endpoint access to private only or restrict public access CIDR blocks to known NAT gateway IP ranges.",
    ruleId: "CIS-EKS-1.2.1",
    scanId: "SCAN-2026-094",
    status: "Open",
    discoveredAt: "2026-10-02T18:48:45Z",
    compliance: ["CIS Kubernetes Benchmark", "NSA CISA K8s Hardening"],
    geminiExplanation: {
      summary: "Public Kubernetes API server endpoints expand the attack surface to any attacker with internet connectivity.",
      attackVector: "Exposure of k8s API server invites continuous authentication fuzzing and targeted attacks against kube-apiserver CVEs.",
      remediationSteps: [
        "1. Navigate to the Amazon EKS Console.",
        "2. Select 'prod-k8s-cluster' and navigate to 'Networking'.",
        "3. Click 'Manage networking' and change cluster endpoint access to 'Private' or specify corporate CIDR."
      ],
      remediationCode: "aws eks update-cluster-config \\\n  --name prod-k8s-cluster \\\n  --resources-vpc-config endpointPublicAccess=false,endpointPrivateAccess=true",
      urgency: "High priority"
    }
  },
  {
    id: "FIND-006",
    title: "CloudTrail Multi-Region Logging Disabled in Secondary Regions",
    severity: "Medium",
    affectedResource: "arn:aws:cloudtrail:us-east-1:892138947192:trail/security-trail",
    resourceType: "AWS CloudTrail",
    cloudProvider: "AWS",
    region: "us-east-1",
    description: "CloudTrail trail is configured for single-region only, missing audit log recording for unmonitored AWS regions (e.g. eu-central-1, ap-southeast-1).",
    securityImpact: "Adversaries can perform clandestine activities in unmonitored regions without triggering forensic audit logs or SIEM alarms.",
    recommendation: "Update CloudTrail configuration to include multi-region logging and enable log file integrity validation.",
    ruleId: "CIS-AWS-3.1",
    scanId: "SCAN-2026-094",
    status: "Open",
    discoveredAt: "2026-10-02T18:49:15Z",
    compliance: ["CIS Benchmark v1.4", "HIPAA §164.312(b)"],
    geminiExplanation: {
      summary: "Single region trails leave blind spots in all other global regions where cloud services remain active.",
      attackVector: "Attackers often deploy rogue EC2 instances in unused regions (e.g., ap-south-1) knowing administrators only monitor their primary region.",
      remediationSteps: [
        "1. Open CloudTrail console at https://console.aws.amazon.com/cloudtrail/",
        "2. Select 'security-trail' and click 'Edit trail'.",
        "3. In Trail settings, check 'Apply trail to all regions'.",
        "4. Save changes."
      ],
      remediationCode: "aws cloudtrail update-trail \\\n  --name security-trail \\\n  --is-multi-region-trail",
      urgency: "Moderate priority"
    }
  },
  {
    id: "FIND-007",
    title: "RDS Database Instance Automatic Backup Retention Less Than 7 Days",
    severity: "Medium",
    affectedResource: "arn:aws:rds:us-east-1:892138947192:db/order-processing-db",
    resourceType: "AWS RDS",
    cloudProvider: "AWS",
    region: "us-east-1",
    description: "The RDS PostgreSQL instance has automated backup retention configured to 1 day, which does not provide adequate recovery window in disaster scenarios.",
    securityImpact: "Data loss in case of ransomware encryption or accidental corruption discovered after 24 hours.",
    recommendation: "Set automated backup retention period to at least 7 to 30 days.",
    ruleId: "AWS-RDS-004",
    scanId: "SCAN-2026-094",
    status: "Remediated",
    discoveredAt: "2026-10-02T18:50:01Z",
    compliance: ["SOC 2 CC7.3", "ISO 27001 A.12.3.1"],
    geminiExplanation: {
      summary: "1-day retention is insufficient to recover from stealthy malicious data tampering.",
      attackVector: "Logic bombs or corrupt database migrations undetected over a weekend cannot be rolled back.",
      remediationSteps: [
        "1. Open Amazon RDS console and choose 'Databases'.",
        "2. Select 'order-processing-db' and click 'Modify'.",
        "3. In Backup section, set 'Backup retention period' to 14 days.",
        "4. Choose 'Apply immediately'."
      ],
      remediationCode: "aws rds modify-db-instance \\\n  --db-instance-identifier order-processing-db \\\n  --backup-retention-period 14 \\\n  --apply-immediately",
      urgency: "Low-Medium priority"
    }
  },
  {
    id: "FIND-008",
    title: "IAM Password Policy Does Not Require Minimum 14 Characters",
    severity: "Low",
    affectedResource: "arn:aws:iam::892138947192:account-password-policy",
    resourceType: "AWS IAM",
    cloudProvider: "AWS",
    region: "global",
    description: "The account password policy requires a minimum length of 8 characters instead of the industry recommended minimum of 14 characters.",
    securityImpact: "Shorter passwords have significantly lower entropy and are vulnerable to hash cracking if captured.",
    recommendation: "Update password policy to require minimum 14 characters, symbol inclusion, and prohibit reuse of last 12 passwords.",
    ruleId: "CIS-AWS-1.8",
    scanId: "SCAN-2026-094",
    status: "Open",
    discoveredAt: "2026-10-02T18:50:40Z",
    compliance: ["CIS Benchmark v1.4", "NIST 800-63B"],
    geminiExplanation: {
      summary: "Modern GPU clusters can crack 8-character complex passwords in hours; 14+ characters provides robust protection.",
      attackVector: "Offline brute force attacks against dumped hashes succeed easily on 8-character passwords.",
      remediationSteps: [
        "1. Navigate to IAM > Account Settings in the AWS Console.",
        "2. Under Password policy, click 'Set password policy'.",
        "3. Set Minimum password length to 14 or higher."
      ],
      remediationCode: "aws iam update-account-password-policy \\\n  --minimum-password-length 14 \\\n  --require-symbols \\\n  --require-numbers \\\n  --require-uppercase-characters \\\n  --require-lowercase-characters",
      urgency: "Routine hygiene"
    }
  },
  {
    id: "FIND-009",
    title: "S3 Server Access Logging Disabled for Static Asset Bucket",
    severity: "Informational",
    affectedResource: "arn:aws:s3:::static-marketing-cdn-assets",
    resourceType: "AWS S3",
    cloudProvider: "AWS",
    region: "us-east-1",
    description: "S3 bucket serving static public marketing assets does not have detailed server access logging sent to a central logging bucket.",
    securityImpact: "Limited auditability for forensic access reconstruction during security investigations.",
    recommendation: "Enable S3 Server Access Logging pointing to central audit-logs bucket.",
    ruleId: "AWS-S3-LOGS",
    scanId: "SCAN-2026-094",
    status: "Open",
    discoveredAt: "2026-10-02T18:51:12Z",
    compliance: ["CIS Benchmark v1.4"],
    geminiExplanation: {
      summary: "Access logs help maintain visibility into asset access patterns and detect anomalies.",
      attackVector: "Low threat profile as assets are intended to be public, but helpful for traffic anomaly auditing.",
      remediationSteps: [
        "1. Open S3 console and choose 'static-marketing-cdn-assets'.",
        "2. Click 'Properties' > 'Server access logging' > 'Edit'.",
        "3. Choose 'Enable' and select target logging bucket."
      ],
      remediationCode: "aws s3api put-bucket-logging \\\n  --bucket static-marketing-cdn-assets \\\n  --bucket-logging-status '{\"LoggingEnabled\":{\"TargetBucket\":\"audit-logs-vault\",\"TargetPrefix\":\"static-assets/\"}}'",
      urgency: "Informational"
    }
  }
];

export const mockReports = [
  {
    id: "REP-2026-001",
    title: "Quarterly Cloud Security Posture Audit - AWS Production",
    scanDate: "2026-10-02",
    scanId: "SCAN-2026-094",
    environment: "AWS Production (us-east-1)",
    cloudProvider: "AWS",
    findingsCount: { critical: 3, high: 2, medium: 2, low: 1, info: 1, total: 9 },
    securityScore: 74,
    complianceSummary: "CIS Benchmark: 78% compliant | SOC 2: 84% compliant | PCI-DSS: 71% compliant",
    executiveSummary: "CloudGuard audit identified 3 Critical vulnerabilities requiring immediate remediation, primarily open S3 bucket permissions, exposed SSH security groups, and root account access keys. Resolving these 3 will elevate security posture score from 74 to 89.",
    generatedBy: "Automated CloudGuard Compliance Engine",
    status: "Finalized",
    fileSize: "2.4 MB"
  },
  {
    id: "REP-2026-002",
    title: "CIS AWS Foundations Benchmark v1.4 Assessment",
    scanDate: "2026-09-25",
    scanId: "SCAN-2026-088",
    environment: "AWS Multi-Account (Prod & Staging)",
    cloudProvider: "AWS",
    findingsCount: { critical: 4, high: 6, medium: 8, low: 5, info: 3, total: 26 },
    securityScore: 68,
    complianceSummary: "CIS Benchmark: 68% compliant | Passed 42 of 68 automated controls",
    executiveSummary: "Comprehensive benchmark evaluation across Identity & Access Management, Storage, Logging, and Networking. Identified high-risk configurations in IAM policies and security group inbound ranges.",
    generatedBy: "Scheduled Weekly Audit",
    status: "Finalized",
    fileSize: "4.1 MB"
  },
  {
    id: "REP-2026-003",
    title: "Pre-Deployment Infrastructure as Code & Cloud Audit",
    scanDate: "2026-09-18",
    scanId: "SCAN-2026-079",
    environment: "Staging VPC (eu-west-1)",
    cloudProvider: "AWS",
    findingsCount: { critical: 1, high: 3, medium: 4, low: 6, info: 2, total: 16 },
    securityScore: 82,
    complianceSummary: "CIS Benchmark: 82% compliant | Zero open SSH bastion ports",
    executiveSummary: "Staging environment validation prior to production release. 1 critical finding remediated during scan cycle. Posture is ready for release review.",
    generatedBy: "Alex Vance (Manual Scan)",
    status: "Finalized",
    fileSize: "1.8 MB"
  }
];

export const mockCloudEnvironments = [
  { id: "env-aws-prod", name: "AWS Production (us-east-1)", provider: "AWS", accountId: "892138947192", region: "us-east-1", resourceCount: 142 },
  { id: "env-aws-stage", name: "AWS Staging (eu-west-1)", provider: "AWS", accountId: "472819230194", region: "eu-west-1", resourceCount: 68 },
  { id: "env-azure-corp", name: "Azure Core Infrastructure", provider: "Azure", accountId: "sub-9201-az-corp", region: "East US", resourceCount: 54 },
  { id: "env-gcp-ai", name: "GCP Analytics & Data Lake", provider: "GCP", accountId: "prj-lake-8491", region: "us-central1", resourceCount: 48 }
];

export const mockBenchmarkProfiles = [
  { id: "cis-v14", name: "CIS Benchmark v1.4 (Standard)", description: "Center for Internet Security foundational benchmarks for cloud hardening." },
  { id: "owasp-cloud", name: "OWASP Cloud Top 10", description: "Top 10 cloud security misconfigurations and security risks." },
  { id: "pci-dss-v4", name: "PCI-DSS v4.0 Cloud Profile", description: "Payment Card Industry data security standards for payment environments." },
  { id: "soc2-cc", name: "SOC 2 Common Criteria", description: "Trust services criteria focusing on security, availability, and confidentiality." }
];
