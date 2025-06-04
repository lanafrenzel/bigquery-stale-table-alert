# BigQuery Stale Table Alert

**A Cloud Run service to monitor stale BigQuery tables and send alerts to Slack**

---

## Overview

This project provides an automated alerting system that checks for BigQuery tables that have not been updated for a specified threshold (default 2 days) and sends notifications to a Slack channel. It helps data teams stay informed about potentially stale data and maintain data freshness across their data warehouse.

---

## Features

* Scheduled SQL queries to identify stale tables and log staleness events in BigQuery
* Node.js service running on Cloud Run that:

  * Queries BigQuery for newly stale tables
  * Sends alerts to Slack via webhook
  * Prevents alert spamming with cooldown period (15 minutes)
* Dockerized for easy deployment
* Health check endpoint for monitoring

---

## Folder Structure

```
bq-stale-table-alert/
├── queries/
│   ├── current_stale_tables.sql       # Query to find stale tables
│   └── table_staleness_log.sql        # Query to log stale table alerts
├── src/
│   ├── index.js                      # Alert service code
│   ├── package.json                  # Node.js dependencies and scripts
│   ├── package-lock.json             # Locked dependency versions
│   └── Dockerfile                   # Docker config to build the service
├── .gitignore                       # Ignore files for Git
└── README.md                        # This file
```

---

## Setup & Deployment

### 1. Configure BigQuery

* Create the dataset for monitoring, e.g., `update_monitoring`.
* Run the SQL queries from `queries/current_stale_tables.sql` and `queries/table_staleness_log.sql` to create the required tables.
* Schedule the `current_stale_tables.sql` query to run regularly (e.g., daily).

### 2. Configure Slack

* Create a Slack Incoming Webhook URL for the channel where you want to receive alerts.
* Replace the placeholder `SLACK_WEBHOOK` URL in `src/index.js` with your Slack webhook URL.

### 3. Deploy the Alert Service

* Build the Docker image:

  ```bash
  docker build -t bq-stale-table-alert .
  ```

* Push it to a container registry (e.g., Google Container Registry).

* Deploy to Cloud Run with proper environment variables and permissions to access BigQuery.

### 4. Run & Monitor

* The service listens on port 8080 and exposes a health check at `/_health`.
* It queries for stale tables, sends Slack alerts, and logs alerts in BigQuery.
* Alerts are throttled to avoid duplicates within 15 minutes.

---

## Environment Variables

* `SLACK_WEBHOOK`: Slack Incoming Webhook URL for sending notifications
* `PROJECT_ID`: Google Cloud Project ID containing BigQuery datasets
* `DATASET`: BigQuery dataset name where monitoring tables reside

You can set these variables via Cloud Run configuration or `.env` (if running locally).

---

## Technologies Used

* Node.js with Express
* Google Cloud BigQuery client library
* Axios for HTTP requests
* Docker & Cloud Run for containerized deployment
* Slack Webhooks for notifications

---

## License

This project is licensed under the MIT License.
