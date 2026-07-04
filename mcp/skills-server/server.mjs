#!/usr/bin/env node
/**
 * recruiting-skills-mcp — stdio MCP server that exposes the recruiting-os
 * .claude/skills as MCP prompts (slash commands in Claude Code) and tools.
 *
 * Skills are read fresh from disk on every request, so edits to a SKILL.md
 * take effect without restarting the server. Registering the server with
 * user scope makes the skills runnable from any Claude Code session, not
 * just this repo.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = process.env.RECRUITING_SKILLS_DIR
  ? resolve(process.env.RECRUITING_SKILLS_DIR)
  : resolve(HERE, "../../.claude/skills");

/** Parse the YAML-ish frontmatter we actually use (flat `key: value` lines). */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: text.slice(match[0].length) };
}

async function loadSkill(dirName) {
  const raw = await readFile(join(SKILLS_DIR, dirName, "SKILL.md"), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    name: meta.name || dirName,
    description: meta.description || "",
    body,
  };
}

async function loadAllSkills() {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skills = [];
  for (const entry of entries.filter((e) => e.isDirectory()).sort()) {
    try {
      skills.push(await loadSkill(entry.name));
    } catch {
      // directory without a readable SKILL.md — skip
    }
  }
  return skills;
}

function skillPromptText(skill, args) {
  const argsBlock = args?.trim()
    ? `\n\nAhmed's request for this invocation:\n${args.trim()}`
    : "";
  return (
    `You are running the "${skill.name}" skill from Ahmed's recruiting-os. ` +
    `Follow its instructions exactly, including all guardrails (interactive only, ` +
    `Gmail drafts only, never fabricate profile content, never delete CRM rows, ` +
    `only touch recruiting_-prefixed Supabase objects).\n\n` +
    `<skill-instructions>\n${skill.body.trim()}\n</skill-instructions>` +
    argsBlock
  );
}

const server = new McpServer({ name: "recruiting-skills", version: "1.0.0" });

// One prompt per skill → /mcp__recruiting-skills__<name> in Claude Code.
// The set is fixed at startup (MCP prompts are registered up front), but the
// SKILL.md content is re-read on every invocation.
const startupSkills = await loadAllSkills();
if (startupSkills.length === 0) {
  console.error(`recruiting-skills-mcp: no skills found in ${SKILLS_DIR}`);
}
for (const { name, description } of startupSkills) {
  const dirName = name;
  server.registerPrompt(
    name,
    {
      description,
      argsSchema: {
        args: z
          .string()
          .optional()
          .describe("Ahmed's request — what to do with this skill"),
      },
    },
    async ({ args }) => {
      const skill = await loadSkill(dirName);
      return {
        messages: [
          {
            role: "user",
            content: { type: "text", text: skillPromptText(skill, args) },
          },
        ],
      };
    }
  );
}

server.registerTool(
  "list_skills",
  {
    description:
      "List Ahmed's recruiting-os skills (name + description + when to use each). " +
      "Call this to decide which skill fits a recruiting task, then load it with get_skill.",
    inputSchema: {},
  },
  async () => {
    const skills = await loadAllSkills();
    const text = skills
      .map((s) => `- ${s.name}: ${s.description}`)
      .join("\n");
    return { content: [{ type: "text", text: text || "No skills found." }] };
  }
);

server.registerTool(
  "get_skill",
  {
    description:
      "Load the full instructions for one recruiting-os skill. Follow the returned " +
      "instructions exactly, including all guardrails, to run the skill.",
    inputSchema: {
      name: z
        .string()
        .describe("Skill name, e.g. recruiting-crm (see list_skills)"),
      args: z
        .string()
        .optional()
        .describe("Ahmed's request — what to do with this skill"),
    },
  },
  async ({ name, args }) => {
    const skills = await loadAllSkills();
    const skill = skills.find((s) => s.name === name);
    if (!skill) {
      const known = skills.map((s) => s.name).join(", ");
      return {
        content: [
          { type: "text", text: `Unknown skill "${name}". Available: ${known}` },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: skillPromptText(skill, args) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Database tools — read/write on the recruiting_ tables only.
//
// Credentials come from webapp/.env.local (same ones the webapp uses), with
// process.env taking precedence. The secret key bypasses RLS, so guardrails
// live here: a hard table allowlist and no delete tool at all (CRM rows are
// never deleted — rejected/ghosted roles are kept for pattern analysis).
// ---------------------------------------------------------------------------

const RECRUITING_TABLES = [
  "recruiting_profile_projects",
  "recruiting_profile_experience",
  "recruiting_profile_skills",
  "recruiting_roles",
  "recruiting_applications",
  "recruiting_contacts",
  "recruiting_interactions",
];

async function loadDbEnv() {
  const env = {};
  try {
    const raw = await readFile(resolve(HERE, "../../webapp/.env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const kv = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (kv) env[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // no .env.local — rely on process.env
  }
  return {
    url: process.env.SUPABASE_URL || env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY || env.SUPABASE_SECRET_KEY,
  };
}

let dbClient = null;
async function getDb() {
  if (!dbClient) {
    const { url, key } = await loadDbEnv();
    if (!url || !key) {
      throw new Error(
        "Supabase credentials not found. Set SUPABASE_URL and SUPABASE_SECRET_KEY " +
          "in webapp/.env.local or the server's environment."
      );
    }
    dbClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return dbClient;
}

const tableSchema = z
  .enum(RECRUITING_TABLES)
  .describe("One of the recruiting_ tables (nothing else is reachable)");

const FILTER_OPS = ["eq", "neq", "gt", "gte", "lt", "lte", "ilike", "is", "in"];
const filtersSchema = z
  .array(
    z.object({
      column: z.string().describe("Column name"),
      op: z.enum(FILTER_OPS).describe("Comparison operator"),
      value: z
        .any()
        .describe(
          "Value to compare against (array for `in`, null for `is`, " +
            "%pattern% for `ilike`)"
        ),
    })
  )
  .describe("Filters, ANDed together");

function applyFilters(query, filters) {
  for (const { column, op, value } of filters) {
    query = query[op](column, value);
  }
  return query;
}

function dbResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function dbError(message) {
  return { content: [{ type: "text", text: message }], isError: true };
}

server.registerTool(
  "db_select",
  {
    description:
      "Read rows from a recruiting_ table in the recruiting-os Supabase DB. " +
      "Returns rows as JSON.",
    inputSchema: {
      table: tableSchema,
      columns: z
        .string()
        .optional()
        .describe("Comma-separated columns (default *)"),
      filters: filtersSchema.optional(),
      order_by: z.string().optional().describe("Column to sort by"),
      descending: z.boolean().optional().describe("Sort descending"),
      limit: z.number().int().positive().max(500).optional()
        .describe("Max rows (default 100)"),
    },
  },
  async ({ table, columns, filters, order_by, descending, limit }) => {
    try {
      const db = await getDb();
      let query = db.from(table).select(columns || "*");
      if (filters?.length) query = applyFilters(query, filters);
      if (order_by) query = query.order(order_by, { ascending: !descending });
      query = query.limit(limit ?? 100);
      const { data, error } = await query;
      if (error) return dbError(`select failed: ${error.message}`);
      return dbResult(data);
    } catch (err) {
      return dbError(String(err.message || err));
    }
  }
);

server.registerTool(
  "db_insert",
  {
    description:
      "Insert rows into a recruiting_ table. Returns the inserted rows " +
      "(including generated ids).",
    inputSchema: {
      table: tableSchema,
      rows: z
        .array(z.record(z.any()))
        .min(1)
        .describe("Rows to insert, as column→value objects"),
    },
  },
  async ({ table, rows }) => {
    try {
      const db = await getDb();
      const { data, error } = await db.from(table).insert(rows).select();
      if (error) return dbError(`insert failed: ${error.message}`);
      return dbResult(data);
    } catch (err) {
      return dbError(String(err.message || err));
    }
  }
);

server.registerTool(
  "db_update",
  {
    description:
      "Update rows in a recruiting_ table. Requires at least one filter " +
      "(no table-wide updates). Returns the updated rows. There is " +
      "deliberately no delete tool: CRM rows are never deleted — mark roles " +
      "rejected/ghosted via status instead.",
    inputSchema: {
      table: tableSchema,
      filters: filtersSchema.min(1),
      patch: z
        .record(z.any())
        .describe("Column→value changes to apply to matching rows"),
    },
  },
  async ({ table, filters, patch }) => {
    try {
      if (Object.keys(patch).length === 0) {
        return dbError("patch is empty — nothing to update");
      }
      const db = await getDb();
      const { data, error } = await applyFilters(
        db.from(table).update(patch),
        filters
      ).select();
      if (error) return dbError(`update failed: ${error.message}`);
      return dbResult(data);
    } catch (err) {
      return dbError(String(err.message || err));
    }
  }
);

await server.connect(new StdioServerTransport());
