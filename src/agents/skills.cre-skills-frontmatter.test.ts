import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFrontmatter, resolveOpenClawMetadata } from "./skills/frontmatter.js";

// The CRE skill modules are this fork's product surface. They are plain
// Markdown, so a broken frontmatter block or an env var that is used in the
// body but never declared in `requires.env` fails *silently*: the gateway's
// readiness gate only reads `requires.env`, so an undeclared var makes the
// skill report "ready" and then expand to an empty string at runtime (blank
// callback number, blank webhook URL, unauthenticated curl). Prior sessions
// found and fixed three such vars by hand; this test turns that manual audit
// into a permanent guard.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const CRE_SKILLS = [
  "crexi-sync",
  "realnex-crm-commands",
  "prospect-research",
  "cold-outreach",
  "property-analysis",
  "underwriting-intake",
  "listing-marketing-plan",
  "just-listed-announcement",
  "market-update-content",
  "showing-management",
  "signback-tracker",
  "content-repurposing",
  "pdf-document-processing",
] as const;

async function readSkill(name: string): Promise<string> {
  return fs.readFile(path.join(repoRoot, "skills", name, "SKILL.md"), "utf8");
}

// Everything after the second `---` delimiter — i.e. the instruction body the
// LLM executes, excluding the frontmatter's own env declarations.
function skillBody(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : raw;
}

// Shell-expandable env references: `$FOO` or `${FOO}`. Requires an
// uppercase-led token of 3+ chars so `$(...)`, `$1`, and price placeholders
// like `$[price]` never match.
function envRefsInBody(body: string): string[] {
  const refs = new Set<string>();
  for (const m of body.matchAll(/\$\{?([A-Z][A-Z0-9_]{2,})\}?/g)) {
    refs.add(m[1]);
  }
  return [...refs];
}

describe("CRE skill frontmatter", () => {
  it.each(CRE_SKILLS)("%s parses with name, description, and emoji", async (name) => {
    const raw = await readSkill(name);
    const frontmatter = parseFrontmatter(raw);

    expect(frontmatter.name, `${name}: name`).toBe(name);
    expect(frontmatter.description, `${name}: description`).toBeTruthy();

    const metadata = resolveOpenClawMetadata(frontmatter);
    expect(metadata, `${name}: openclaw metadata block`).toBeDefined();
    expect(metadata?.emoji, `${name}: emoji`).toBeTruthy();
  });

  it.each(CRE_SKILLS)("%s declares a non-empty readiness gate", async (name) => {
    const metadata = resolveOpenClawMetadata(parseFrontmatter(await readSkill(name)));
    const env = metadata?.requires?.env ?? [];
    expect(env.length, `${name}: requires.env`).toBeGreaterThan(0);
  });

  it.each(CRE_SKILLS)("%s primaryEnv is one of its required env vars", async (name) => {
    const metadata = resolveOpenClawMetadata(parseFrontmatter(await readSkill(name)));
    const env = metadata?.requires?.env ?? [];
    const primaryEnv = metadata?.primaryEnv;
    expect(primaryEnv, `${name}: primaryEnv`).toBeTruthy();
    expect(env, `${name}: primaryEnv must be in requires.env`).toContain(primaryEnv);
  });

  it.each(CRE_SKILLS)("%s declares every env var it uses in its body", async (name) => {
    const raw = await readSkill(name);
    const metadata = resolveOpenClawMetadata(parseFrontmatter(raw));
    const declared = new Set(metadata?.requires?.env ?? []);
    const used = envRefsInBody(skillBody(raw));

    const undeclared = used.filter((v) => !declared.has(v));
    expect(
      undeclared,
      `${name}: these env vars are used in the body but missing from requires.env ` +
        `(gateway would report the skill ready, then expand them to empty at runtime): ` +
        undeclared.join(", "),
    ).toEqual([]);
  });

  // Contact details reach these skills as HUMAN placeholders (`[phone]`), not
  // `$VAR` shell refs, so the check above — and the prior manual `$VAR`-only
  // audits — are structurally blind to them. Every `[phone]` across the CRE
  // skills is Stockton's own callback number, dropped into emails/SMS sent to
  // real third parties (prospects, buyers, sellers, attorneys). If the backing
  // env var isn't in `requires.env` the gateway still reports the skill ready,
  // and the message goes out with a blank number — or, for the mailing-address
  // footer, a blank CAN-SPAM footer on a list email (a compliance failure, not
  // just a cosmetic one). `[email]` is intentionally NOT guarded: it also
  // appears as a prospect-lookup query param (`&email=[email]`), so it isn't
  // reliably Stockton's address. `[phone]` and `[mailing address]` are
  // unambiguous — every occurrence across the CRE skills is Stockton's own
  // (property contexts use the capitalized `[Address]`).
  const PLACEHOLDER_ENV: ReadonlyArray<[RegExp, string]> = [
    [/\[phone\]/i, "STOCKTON_PHONE"],
    [/\[mailing address\]/i, "STOCKTON_MAILING_ADDRESS"],
  ];

  it.each(CRE_SKILLS)("%s declares the env var behind every contact placeholder", async (name) => {
    const raw = await readSkill(name);
    const body = skillBody(raw);
    const declared = new Set(resolveOpenClawMetadata(parseFrontmatter(raw))?.requires?.env ?? []);

    const missing = PLACEHOLDER_ENV.filter(([re]) => re.test(body))
      .map(([, env]) => env)
      .filter((env) => !declared.has(env));
    expect(
      missing,
      `${name}: uses a contact placeholder whose env var is missing from requires.env ` +
        `(gateway reports the skill ready, then the outbound message goes out blank): ` +
        missing.join(", "),
    ).toEqual([]);
  });
});
