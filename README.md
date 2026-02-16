# Sprint Performance Dashboard

A React-based sprint performance dashboard that imports Jira ticket data and visualizes sprint metrics including velocity, risk, and developer workload.

## Getting Started

```bash
npm install
npm run dev
```

## Deploying to GitHub Pages

This project is configured for GitHub Pages deployment via GitHub Actions.

1. Go to **Settings > Pages** in your GitHub repo.
2. Under **Source**, select **GitHub Actions**.
3. Push to `main` — the workflow will build and deploy automatically.

---

## How to export Specific Tickets from Jira

The dashboard accepts Jira XML exports. To get a select number of specific tickets into a single XML file that is import-ready for this tool, follow the steps below.

### Step 1: Isolate Your Tickets

1. In Jira, go to **Filters > Advanced Issue Search**.
2. Switch to **JQL mode** (click the "JQL" button next to the search bar).
3. Enter the following query, replacing the placeholders with your actual ticket keys:

   ```
   key in (PROJ-1, PROJ-2, PROJ-3, PROJ-4, PROJ-5, PROJ-6)
   ```

4. Hit **Search**. Verify that only your selected tickets appear in the results.

### Step 2: Export to XML

1. Look for the **Export** button in the top-right corner of the search results page.
2. Select **Export XML** from the dropdown menu.
3. Jira will generate a single `.xml` file containing the full metadata (descriptions, comments, custom fields, etc.) for only those selected tickets.

### Step 3: Import into the Dashboard

1. Open the Sprint Performance Dashboard.
2. On the **Data Input** panel, use the **XML Upload** tab.
3. Click the upload area or drag and drop your exported `.xml` file.
4. Your tickets will be parsed and loaded into the dashboard automatically.

### Alternative: Using the Bulk Change Tool

If you have a very long list and don't want to type the keys manually:

1. Go to your **Backlog** or **Active Sprint** view.
2. Hold **Ctrl** (or **Cmd** on Mac) and click the tickets you want to select.
3. Right-click on one of them and select **Bulk Change**.
4. While the Bulk Change wizard doesn't have a direct "Export to XML" button, it will confirm your selection. Once confirmed, click **"View in Navigator"** to jump back to the filtered Issue Navigator with those specific tickets — then follow **Step 2** above to export.

### Why XML Instead of CSV?

- **Nested Data** — XML preserves the hierarchy of comments and sub-tasks better than a flat CSV file.
- **System Migration** — This is the standard format for moving tickets between Jira instances.
- **Full Metadata** — XML exports include story points, priorities, assignees, statuses, and all custom fields that the dashboard uses for its analysis.
