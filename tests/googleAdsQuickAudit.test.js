const test = require('node:test');
const assert = require('node:assert/strict');

const { auditGoogleAds } = require('../src/googleAdsQuickAudit');

test('returns critical finding when campaigns are missing', () => {
  const report = auditGoogleAds({});

  assert.equal(report.totals.critical, 1);
  assert.equal(report.findings[0].message, 'No campaigns found.');
  assert.equal(report.score, 80);
});

test('detects conversion, CTR, CPC and disapproved ad issues', () => {
  const report = auditGoogleAds({
    campaigns: [
      {
        name: 'Search Campaign',
        status: 'ENABLED',
        hasConversionTracking: false,
        ctr: 0.01,
        cpc: 6.5,
        ads: [{ status: 'DISAPPROVED' }]
      }
    ]
  });

  assert.equal(report.totals.critical, 2);
  assert.equal(report.totals.warning, 2);
  assert.equal(report.score, 40);
});

test('keeps a clean campaign at full score', () => {
  const report = auditGoogleAds({
    campaigns: [
      {
        name: 'Brand Campaign',
        status: 'ENABLED',
        hasConversionTracking: true,
        ctr: 0.15,
        cpc: 1.2,
        ads: [{ status: 'APPROVED' }]
      }
    ]
  });

  assert.equal(report.findings.length, 0);
  assert.equal(report.score, 100);
});
