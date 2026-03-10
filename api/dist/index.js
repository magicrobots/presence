"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express2 = __toESM(require("express"));

// src/routes/preferences.ts
var import_express = require("express");
var import_drizzle_orm = require("drizzle-orm");

// src/db/index.ts
var import_pg = require("pg");
var import_node_postgres = require("drizzle-orm/node-postgres");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  userPreferences: () => userPreferences
});
var import_pg_core = require("drizzle-orm/pg-core");
var userPreferences = (0, import_pg_core.pgTable)("user_preferences", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  username: (0, import_pg_core.varchar)("username", { length: 255 }).notNull().unique(),
  qualityPreset: (0, import_pg_core.varchar)("quality_preset", { length: 10 }).notNull().default("normal"),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// src/db/index.ts
var pool = new import_pg.Pool({
  connectionString: process.env["DATABASE_URL"]
});
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// src/lib/response.ts
function sendSuccess(res, data) {
  const body = { success: true, data };
  res.json(body);
}
function sendError(res, message, statusCode, code) {
  const body = { success: false, error: message, ...code !== void 0 ? { code } : {} };
  res.status(statusCode).json(body);
}

// src/routes/preferences.ts
var VALID_PRESETS = ["high", "normal", "low"];
var preferencesRouter = (0, import_express.Router)();
preferencesRouter.get("/", async (req, res) => {
  const username = String(req.query["username"] ?? "").trim().toLowerCase();
  if (!username) {
    return sendError(res, "username is required", 400, "MISSING_USERNAME");
  }
  try {
    const rows = await db.select().from(userPreferences).where((0, import_drizzle_orm.eq)(userPreferences.username, username));
    if (rows.length === 0) {
      return sendError(res, "Not found", 404, "NOT_FOUND");
    }
    const row = rows[0];
    return sendSuccess(res, { username: row.username, qualityPreset: row.qualityPreset });
  } catch {
    return sendError(res, "Internal server error", 500, "INTERNAL_ERROR");
  }
});
preferencesRouter.put("/", async (req, res) => {
  const body = req.body;
  const username = String(body.username ?? "").trim().toLowerCase();
  if (!username) {
    return sendError(res, "username is required", 400, "MISSING_USERNAME");
  }
  const preset = body.qualityPreset;
  if (!preset || !VALID_PRESETS.includes(preset)) {
    return sendError(res, `qualityPreset must be one of: ${VALID_PRESETS.join(", ")}`, 400, "INVALID_PRESET");
  }
  try {
    const now = /* @__PURE__ */ new Date();
    const [row] = await db.insert(userPreferences).values({ username, qualityPreset: preset, createdAt: now, updatedAt: now }).onConflictDoUpdate({
      target: userPreferences.username,
      set: { qualityPreset: preset, updatedAt: /* @__PURE__ */ new Date() }
    }).returning();
    if (!row) {
      return sendError(res, "Internal server error", 500, "INTERNAL_ERROR");
    }
    return sendSuccess(res, { username: row.username, qualityPreset: row.qualityPreset });
  } catch {
    return sendError(res, "Internal server error", 500, "INTERNAL_ERROR");
  }
});

// src/index.ts
var app = (0, import_express2.default)();
var PORT = process.env["PORT"] ?? 3001;
app.use(import_express2.default.json());
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/preferences", preferencesRouter);
app.use((_req, res) => {
  sendError(res, "Not found", 404, "NOT_FOUND");
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  sendError(res, "Internal server error", 500, "INTERNAL_ERROR");
});
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
var index_default = app;
