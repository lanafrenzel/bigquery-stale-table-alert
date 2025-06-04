const express = require("express");
const { BigQuery } = require("@google-cloud/bigquery");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 8080;

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const DATASET = process.env.BQ_DATASET;

let lastAlertTime = null;

app.get("/_health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", async (req, res) => {
  if (!SLACK_WEBHOOK || !PROJECT_ID || !DATASET) {
    res.status(500).send("Missing required environment variables");
    return;
  }

  const bq = new BigQuery({ projectId: PROJECT_ID });

  try {
    const currentTime = new Date();
    if (lastAlertTime && (currentTime - lastAlertTime) < 15 * 60 * 1000) {
      res.status(200).send("Alert was sent recently. Skipping to prevent duplicates.");
      return;
    }

    const query = `
      SELECT t.table_name, t.last_modified 
      FROM \`${PROJECT_ID}.${DATASET}.current_stale_tables\` t
      WHERE t.last_modified < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 2 DAY)
      AND t.table_name NOT IN (
        SELECT table_name
        FROM \`${PROJECT_ID}.${DATASET}.table_staleness_logs\`
        WHERE log_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
      )
    `;

    const [job] = await bq.createQueryJob({ query });
    const [rows] = await job.getQueryResults();

    if (rows.length > 0) {
      await axios.post(SLACK_WEBHOOK, {
        text: `🚨 *${rows.length} new stale table(s) detected* that have not been updated in the last 2 days.`
      });

      lastAlertTime = currentTime;

      const logQueryBase = `
        INSERT INTO \`${PROJECT_ID}.${DATASET}.table_staleness_logs\`
        (log_time, table_name, last_modified)
        VALUES
      `;

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valueStrings = batch.map(row =>
          `(CURRENT_TIMESTAMP(), '${row.table_name}', TIMESTAMP('${row.last_modified.value.slice(0, 19)}'))`
        ).join(', ');
        const batchQuery = logQueryBase + valueStrings;
        await bq.query(batchQuery);
      }
    }

    res.status(200).send(`Checked stale table count: ${rows.length}`);
  } catch (err) {
    console.error("Error querying BigQuery or sending Slack alert:", err);
    try {
      await axios.post(SLACK_WEBHOOK, {
        text: `❌ *Error in stale table monitor*: ${err.message}`
      });
    } catch (slackErr) {
      console.error("Failed to send error to Slack:", slackErr);
    }
    res.status(500).send(`Failed to send alert: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`Alert service running on port ${port}`);
});
