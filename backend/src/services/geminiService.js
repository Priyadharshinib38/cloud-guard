import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates an AI-powered security explanation and recommendation using Google Gemini
 */
export async function generateFindingExplanation(finding) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('placeholder')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert cloud security architect.
Analyze the following cloud security finding and provide a clear, concise risk explanation and remediation guidance.

Finding Details:
- Title: ${finding.title}
- Severity: ${finding.severity}
- Service: ${finding.service}
- Description: ${finding.description}
- Affected Resource: ${finding.affectedResource || 'N/A'}

Respond in valid JSON format with exactly these two keys:
{
  "explanation": "A 2-3 sentence explanation of the security risk and potential attack vector.",
  "recommendation": "Specific, actionable steps to remediate this misconfiguration."
}

Do not include markdown code block backticks. Return raw JSON only.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Clean any potential markdown code fence
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.explanation && parsed.recommendation) {
        return {
          explanation: parsed.explanation,
          recommendation: parsed.recommendation,
          source: 'gemini-live'
        };
      }
    } catch (err) {
      console.warn('[Gemini] Live API call failed, falling back to built-in security intelligence:', err.message);
    }
  }

  // Safe fallback security guidance tailored to finding
  return getFallbackSecurityGuidance(finding);
}

function getFallbackSecurityGuidance(finding) {
  const title = (finding.title || '').toLowerCase();
  const service = (finding.service || '').toLowerCase();

  let explanation = `AI analysis for "${finding.title}": this finding represents a potential security weakness in the ${finding.service} environment.`;
  let recommendation = 'Review the affected resource, restrict unnecessary access, and apply the recommended cloud security controls.';

  if (title.includes('s3') || service.includes('s3')) {
    explanation = `The S3 bucket permits unrestricted public ingress, allowing unauthenticated actors to enumerate, read, or overwrite sensitive cloud storage objects. Public read access can lead to data exfiltration, while public write access allows arbitrary malware or ransomware injection.`;
    recommendation = `Enable 'Block Public Access' at both the account and bucket levels. Review bucket ACLs and remove any grants to 'AllUsers' or 'AuthenticatedUsers'. Enforce least-privilege bucket policies restricting access strictly to authorized IAM roles.`;
  } else if (title.includes('security group') || title.includes('port') || service.includes('ec2')) {
    explanation = `Inbound administrative port (e.g., SSH port 22 or RDP port 3389) is open to the entire internet (0.0.0.0/0). This exposes virtual machines directly to automated credential stuffing, brute-force attacks, and remote code execution vulnerabilities.`;
    recommendation = `Modify the EC2 security group inbound rules immediately. Delete the 0.0.0.0/0 rule and restrict ingress strictly to corporate static IP addresses, VPN gateways, or migrate to AWS Systems Manager Session Manager for portless management.`;
  } else if (title.includes('rds') || title.includes('encryption') || service.includes('rds')) {
    explanation = `The relational database instance is operating without storage-level encryption at rest. Unencrypted databases risk unauthorized data recovery if physical hardware or storage snapshots are compromised or leaked.`;
    recommendation = `Take a manual snapshot of the RDS instance, copy the snapshot with AWS KMS encryption enabled, and restore the new encrypted snapshot as the primary database cluster.`;
  } else if (title.includes('iam') || service.includes('iam')) {
    explanation = `The IAM entity possesses overly permissive permissions or inactive administrator access keys. Excessive privileges violate the principle of least privilege, enabling lateral movement and privilege escalation in the event of credential theft.`;
    recommendation = `Audit IAM policies using AWS IAM Access Advisor, revoke unused administrative permissions, mandate Multi-Factor Authentication (MFA), and enforce key rotation every 90 days.`;
  }

  return {
    explanation,
    recommendation,
    source: 'cloudguard-security-engine'
  };
}
