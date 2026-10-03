import PDFDocument from 'pdfkit';

/**
 * Generates a comprehensive, professional PDF security audit report stream
 * using existing CloudGuard report, scan, and findings data.
 *
 * @param {Object} report - Report record from database
 * @param {Object} scan - Scan record associated with report
 * @param {Array} findings - Findings associated with this report/scan
 * @param {Object} res - Express response stream
 */
export function generatePdfReport(report, scan, findings, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: report.name || 'CloudGuard Security Audit Report',
      Author: 'CloudGuard Security Platform',
      Subject: 'Cloud Security Audit and Benchmark Evaluation'
    }
  });

  doc.pipe(res);

  // Palette constants
  const primaryColor = '#0f172a'; // Slate 900
  const accentColor = '#0284c7';  // Sky 600
  const grayColor = '#64748b';    // Slate 500
  const borderColor = '#e2e8f0';  // Slate 200

  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#2563eb'
  };

  // Header Banner
  doc
    .rect(50, 45, 495, 60)
    .fill('#0f172a');

  doc
    .fillColor('#38bdf8')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('CLOUDGUARD SECURITY PLATFORM', 70, 58, { characterSpacing: 1.5 });

  doc
    .fillColor('#ffffff')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(report.name || 'Cloud Infrastructure Security Audit Report', 70, 75);

  doc.moveDown(3);

  // Metadata Table Box
  const metaY = 125;
  doc
    .rect(50, metaY, 495, 65)
    .fillAndStroke('#f8fafc', borderColor);

  doc
    .fillColor(grayColor)
    .fontSize(9)
    .font('Helvetica')
    .text('Report ID:', 65, metaY + 12)
    .text('Scan ID:', 65, metaY + 28)
    .text('Cloud Provider:', 65, metaY + 44)
    .text('Audit Date:', 310, metaY + 12)
    .text('Compliance Standards:', 310, metaY + 28)
    .text('Status:', 310, metaY + 44);

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text(report.id || 'N/A', 140, metaY + 12)
    .text(report.scanId || (scan ? scan.id : 'N/A'), 140, metaY + 28)
    .text(scan ? scan.provider || 'AWS' : 'AWS', 140, metaY + 44)
    .text(report.date || new Date().toLocaleDateString('en-GB'), 415, metaY + 12)
    .text('CIS AWS v1.4, SOC 2', 415, metaY + 28)
    .fillColor('#16a34a')
    .text(report.status || 'Ready', 415, metaY + 44);

  // Executive Summary & Score Section
  doc.y = 210;
  doc
    .fillColor(primaryColor)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Executive Summary & Security Posture', 50, 210);

  // Calculate stats from findings
  const totalFindings = findings.length;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const f of findings) {
    const s = (f.severity || '').toLowerCase();
    if (s === 'critical') criticalCount++;
    else if (s === 'high') highCount++;
    else if (s === 'medium') mediumCount++;
    else if (s === 'low') lowCount++;
  }

  let securityScore = 100 - (criticalCount * 12 + highCount * 6 + mediumCount * 3 + lowCount * 1);
  if (securityScore < 10) securityScore = 10;
  if (securityScore > 100) securityScore = 100;

  // Posture Card
  const cardY = 232;
  const cardWidth = 115;
  const cardHeight = 55;

  // 1. Security Score Card
  doc.rect(50, cardY, cardWidth, cardHeight).fillAndStroke('#f0f9ff', '#bae6fd');
  doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold').text('SECURITY SCORE', 60, cardY + 10);
  doc.fillColor('#0369a1').fontSize(18).font('Helvetica-Bold').text(`${securityScore}/100`, 60, cardY + 25);

  // 2. Critical Findings Card
  doc.rect(175, cardY, 95, cardHeight).fillAndStroke('#fef2f2', '#fecaca');
  doc.fillColor(severityColors.critical).fontSize(9).font('Helvetica-Bold').text('CRITICAL', 185, cardY + 10);
  doc.fillColor('#991b1b').fontSize(18).font('Helvetica-Bold').text(String(criticalCount), 185, cardY + 25);

  // 3. High Findings Card
  doc.rect(280, cardY, 80, cardHeight).fillAndStroke('#fff7ed', '#ffedd5');
  doc.fillColor(severityColors.high).fontSize(9).font('Helvetica-Bold').text('HIGH', 290, cardY + 10);
  doc.fillColor('#c2410c').fontSize(18).font('Helvetica-Bold').text(String(highCount), 290, cardY + 25);

  // 4. Medium Card
  doc.rect(370, cardY, 80, cardHeight).fillAndStroke('#fffbeb', '#fef3c7');
  doc.fillColor(severityColors.medium).fontSize(9).font('Helvetica-Bold').text('MEDIUM', 380, cardY + 10);
  doc.fillColor('#b45309').fontSize(18).font('Helvetica-Bold').text(String(mediumCount), 380, cardY + 25);

  // 5. Low Card
  doc.rect(460, cardY, 85, cardHeight).fillAndStroke('#eff6ff', '#dbeafe');
  doc.fillColor(severityColors.low).fontSize(9).font('Helvetica-Bold').text('LOW', 470, cardY + 10);
  doc.fillColor('#1d4ed8').fontSize(18).font('Helvetica-Bold').text(String(lowCount), 470, cardY + 25);

  // Findings Section Header
  doc.y = 310;
  doc
    .fillColor(primaryColor)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(`Identified Security Findings (${totalFindings})`, 50, 310);

  let currentY = 335;

  if (findings.length === 0) {
    doc
      .fillColor(grayColor)
      .fontSize(10)
      .font('Helvetica')
      .text('No vulnerabilities or misconfigurations detected in this cloud environment.', 50, currentY);
  } else {
    findings.forEach((finding, index) => {
      // If we are nearing bottom of the page, add a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const sev = (finding.severity || 'low').toLowerCase();
      const sevColor = severityColors[sev] || grayColor;

      // Finding container box
      const boxHeight = 85;
      doc
        .rect(50, currentY, 495, boxHeight)
        .fillAndStroke('#ffffff', borderColor);

      // Severity left stripe
      doc
        .rect(50, currentY, 5, boxHeight)
        .fill(sevColor);

      // Title & Number
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${finding.title}`, 65, currentY + 10, { width: 340 });

      // Severity Tag
      doc
        .rect(440, currentY + 8, 90, 18)
        .fill(sevColor);
      doc
        .fillColor('#ffffff')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text((finding.severity || 'LOW').toUpperCase(), 440, currentY + 13, { width: 90, align: 'center' });

      // Service & Resource
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica')
        .text(`Service: ${finding.service || 'Cloud'} | Affected Resource: ${finding.affectedResource || 'N/A'}`, 65, currentY + 28, { width: 460 });

      // Description
      doc
        .fillColor('#334155')
        .fontSize(8.5)
        .font('Helvetica')
        .text(finding.description || 'No description available.', 65, currentY + 42, { width: 465, height: 22, ellipsis: true });

      // Recommendation
      doc
        .fillColor('#0369a1')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`Remediation: ${finding.recommendation || 'Apply appropriate security controls.'}`, 65, currentY + 66, { width: 465, height: 16, ellipsis: true });

      currentY += boxHeight + 12;
    });
  }

  // Footer on current page
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .font('Helvetica')
    .text(
      `Generated by CloudGuard Security Platform • Report ID: ${report.id} • Confidential`,
      50,
      780,
      { align: 'center', width: 495 }
    );

  doc.end();
}
