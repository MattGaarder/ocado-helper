# Ocado Helper

Ocado Helper is a single Node/Express application. It accepts an Ocado receipt
PDF, finds likely ingredients in the browser, stores the selected items in
MongoDB, and creates one matching page per item in Notion.

The browser UI and API live in this repository and are served by the same
Express process. There is no separate frontend or backend deployment to run.

## Run locally

1. Use Node.js 18 or later.
2. Install the locked dependencies:

   ```sh
   npm ci
   ```

3. Copy `.env.example` to `.env` and supply your MongoDB and Notion values.
   Never commit `.env`.
4. Start the app:

   ```sh
   npm start
   ```

5. Open `http://localhost:3001`.

`npm run dev` starts Node in watch mode. `npm run check` performs a quick
syntax check of the server and browser entry points.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `NOTION_API_KEY` | Notion integration token |
| `NOTION_DATABASE_ID` | Target Notion database ID |

The configured Notion database must have `Item` (title), `Storage`
(multi-select), and `MONGO_ID` (rich text) properties.

## Data flow and safety

Selected ingredients are inserted into MongoDB first, then only those newly
created rows are sent to Notion. The application records the resulting Notion
page ID on each Mongo document.

The old `/api/v1/notion/sync` route is intentionally disabled. Its previous
implementation could delete MongoDB rows based on an incomplete Notion query.
Uploaded PDFs are runtime files in `uploads/` and are intentionally ignored by
Git.
