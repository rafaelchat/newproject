const fs = require('fs');

const DEFAULT_THRESHOLDS = {
  ctrMin: 0.02,
  cpcMax: 5
};

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function addFinding(findings, severity, message, campaign) {
  findings.push({ severity, message, campaign: campaign || null });
}

function auditGoogleAds(input, thresholds = DEFAULT_THRESHOLDS) {
  const campaigns = Array.isArray(input?.campaigns) ? input.campaigns : [];
  const findings = [];

  if (campaigns.length === 0) {
    addFinding(findings, 'critical', 'No campaigns found.');
  }

  for (const campaign of campaigns) {
    const name = campaign?.name || 'Unnamed campaign';
    const status = campaign?.status || 'UNKNOWN';

    if (status !== 'ENABLED') {
      addFinding(findings, 'warning', `Campaign is not enabled (status: ${status}).`, name);
    }

    if (campaign?.hasConversionTracking === false) {
      addFinding(findings, 'critical', 'Conversion tracking is disabled.', name);
    }

    const ctr = toNumber(campaign?.ctr);
    if (ctr !== null && ctr < thresholds.ctrMin) {
      addFinding(findings, 'warning', `CTR is low (${ctr}).`, name);
    }

    const cpc = toNumber(campaign?.cpc);
    if (cpc !== null && cpc > thresholds.cpcMax) {
      addFinding(findings, 'warning', `CPC is high (${cpc}).`, name);
    }

    const ads = Array.isArray(campaign?.ads) ? campaign.ads : [];
    const disapprovedAds = ads.filter((ad) => ad?.disapproved === true || ad?.status === 'DISAPPROVED').length;
    if (disapprovedAds > 0) {
      addFinding(findings, 'critical', `${disapprovedAds} disapproved ad(s) found.`, name);
    }
  }

  const severityWeight = { critical: 20, warning: 10, info: 5 };
  const score = Math.max(
    0,
    100 - findings.reduce((sum, finding) => sum + (severityWeight[finding.severity] || 0), 0)
  );

  const totals = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 }
  );

  return { score, totals, findings };
}

function formatReport(report) {
  const lines = [
    'Google Ads Quick Audit',
    '======================',
    `Score: ${report.score}/100`,
    `Critical: ${report.totals.critical} | Warning: ${report.totals.warning} | Info: ${report.totals.info}`,
    ''
  ];

  if (report.findings.length === 0) {
    lines.push('No issues detected.');
  } else {
    lines.push('Findings:');
    for (const finding of report.findings) {
      const scope = finding.campaign ? ` [${finding.campaign}]` : '';
      lines.push(`- ${finding.severity.toUpperCase()}${scope}: ${finding.message}`);
    }
  }

  return lines.join('\n');
}

function runCli(argv = process.argv.slice(2)) {
  const [filePath, outputMode] = argv;

  if (!filePath) {
    console.error('Usage: node src/googleAdsQuickAudit.js <input.json> [--json]');
    return 1;
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Unable to read input file: ${error.message}`);
    return 1;
  }

  const report = auditGoogleAds(payload);
  if (outputMode === '--json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report));
  }

  return 0;
}

if (require.main === module) {
  process.exit(runCli());
}

module.exports = {
  DEFAULT_THRESHOLDS,
  auditGoogleAds,
  formatReport,
  runCli
};
