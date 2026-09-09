# Google Ads Quick Audit Tool

Quick CLI utility to run a lightweight audit on Google Ads campaign exports.

## Input format
Provide a JSON file with a `campaigns` array. Each campaign can include:

- `name`
- `status` (for example `ENABLED`)
- `hasConversionTracking` (boolean)
- `ctr` (number)
- `cpc` (number)
- `ads` (array of ad objects, where an ad can include `status` or `disapproved`)

## Usage

```bash
npm test
node src/googleAdsQuickAudit.js ./sample.json
node src/googleAdsQuickAudit.js ./sample.json --json
```
