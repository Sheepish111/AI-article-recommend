import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const db = new DatabaseSync(join(root, "prisma", "dev.db"));

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Source" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "homepageUrl" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Item" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "author" TEXT,
  "publishedAt" DATETIME NOT NULL,
  "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT NOT NULL,
  "metricsJson" TEXT NOT NULL,
  "score" REAL NOT NULL DEFAULT 0,
  "qualitySignals" TEXT,
  CONSTRAINT "Item_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Favorite" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Favorite_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Annotation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Annotation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DailyRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" DATETIME,
  "inserted" INTEGER NOT NULL DEFAULT 0,
  "updated" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  CONSTRAINT "DailyRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Source_kind_name_key" ON "Source"("kind", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Item_sourceId_externalId_key" ON "Item"("sourceId", "externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "Item_url_key" ON "Item"("url");
CREATE INDEX IF NOT EXISTS "Item_publishedAt_idx" ON "Item"("publishedAt");
CREATE INDEX IF NOT EXISTS "Item_score_idx" ON "Item"("score");
CREATE INDEX IF NOT EXISTS "Item_category_idx" ON "Item"("category");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_itemId_key" ON "Favorite"("itemId");
CREATE UNIQUE INDEX IF NOT EXISTS "Annotation_itemId_key" ON "Annotation"("itemId");
`);

db.close();
console.log("SQLite schema initialized at prisma/dev.db");
