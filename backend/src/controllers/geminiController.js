import { getDb } from '../db/database.js';
import { generateFindingExplanation } from '../services/geminiService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function explainFinding(req, res, next) {
  try {
    const { id } = req.params;
    const bodyFinding = req.body || {};
    const db = getDb();

    let finding = null;
    if (id) {
      finding = db.prepare('SELECT * FROM findings WHERE id = ?').get(id);
    }

    // Merge finding with any body data passed in
    const findingData = {
      title: bodyFinding.title || (finding ? finding.title : 'Cloud Misconfiguration'),
      severity: bodyFinding.severity || (finding ? finding.severity : 'Medium'),
      service: bodyFinding.service || (finding ? finding.service : 'Cloud Infrastructure'),
      description: bodyFinding.description || (finding ? finding.description : 'Unspecified security finding.'),
      affectedResource: bodyFinding.affectedResource || (finding ? finding.affectedResource : 'N/A')
    };

    const aiResult = await generateFindingExplanation(findingData);

    res.status(200).json({
      success: true,
      explanation: aiResult.explanation,
      recommendation: aiResult.recommendation,
      data: {
        summary: aiResult.explanation,
        attackVector: 'Exposed resource configurations, unauthenticated perimeter access, or policy escalation.',
        remediationSteps: [aiResult.recommendation],
        remediationCode: `# Remediate via AWS CLI\naws securityhub get-findings --filters '{"Id": [{"Value": "${id || 'finding'}", "Comparison": "EQUALS"}]}'`,
        urgency: `${findingData.severity} Priority Action`
      }
    });
  } catch (err) {
    next(err);
  }
}
