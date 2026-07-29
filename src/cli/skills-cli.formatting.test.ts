import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildWorkspaceSkillStatus } from "../agents/skills-status.js";
import type { SkillStatusEntry, SkillStatusReport } from "../agents/skills-status.js";
import type { SkillEntry } from "../agents/skills.js";
import { createCanonicalFixtureSkill } from "../agents/skills.test-helpers.js";
import { stripAnsi } from "../terminal/ansi.js";
import { captureEnv } from "../test-utils/env.js";
import { formatSkillInfo, formatSkillsCheck, formatSkillsList } from "./skills-cli.format.js";

describe("skills-cli (e2e)", () => {
  let tempWorkspaceDir = "";
  let tempBundledDir = "";
  let envSnapshot: ReturnType<typeof captureEnv>;

  beforeAll(() => {
    envSnapshot = captureEnv(["OPENCLAW_BUNDLED_SKILLS_DIR"]);
    tempWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-skills-test-"));
    tempBundledDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-bundled-skills-test-"));
    process.env.OPENCLAW_BUNDLED_SKILLS_DIR = tempBundledDir;
  });

  afterAll(() => {
    if (tempWorkspaceDir) {
      fs.rmSync(tempWorkspaceDir, { recursive: true, force: true });
    }
    if (tempBundledDir) {
      fs.rmSync(tempBundledDir, { recursive: true, force: true });
    }
    envSnapshot.restore();
  });

  function createEntries(): SkillEntry[] {
    const baseDir = path.join(tempWorkspaceDir, "peekaboo");
    const filePath = path.join(baseDir, "SKILL.md");
    return [
      {
        skill: createFixtureSkill({
          name: "peekaboo",
          description: "Capture UI screenshots",
          filePath,
          baseDir,
          source: "openclaw-bundled",
        }),
        frontmatter: {},
        metadata: { emoji: "📸" },
      },
    ];
  }

  it("loads bundled skills and formats them", () => {
    const entries = createEntries();
    const report = buildWorkspaceSkillStatus(tempWorkspaceDir, {
      managedSkillsDir: "/nonexistent",
      entries,
    });

    expect(report.skills.length).toBeGreaterThan(0);

    const listOutput = formatSkillsList(report, {});
    expect(listOutput).toContain("Skills");

    const checkOutput = formatSkillsCheck(report, {});
    expect(checkOutput).toContain("Total:");

    const jsonOutput = formatSkillsList(report, { json: true });
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.skills).toBeInstanceOf(Array);
  });

  it("formats info for a real bundled skill (peekaboo)", () => {
    const entries = createEntries();
    const report = buildWorkspaceSkillStatus(tempWorkspaceDir, {
      managedSkillsDir: "/nonexistent",
      entries,
    });

    const peekaboo = report.skills.find((s) => s.name === "peekaboo");
    if (!peekaboo) {
      throw new Error("peekaboo fixture skill missing");
    }

    const output = formatSkillInfo(report, "peekaboo", {});
    expect(output).toContain("peekaboo");
    expect(output).toContain("Details:");
  });

  it("does not falsely mark every anyBins candidate as installed when only one is satisfied", () => {
    // Regression: anyBins is an "any of" requirement — resolveMissingAnyBins reports
    // missing.anyBins as empty as soon as ONE candidate is present, but formatSkillInfo
    // used to collapse that single satisfied-flag onto every candidate name, so an
    // unrelated binary that isn't installed at all showed a "✓" too.
    const entry: SkillStatusEntry = {
      name: "multi-bin-skill",
      description: "Needs any of several CLIs",
      source: "openclaw-bundled",
      bundled: true,
      filePath: "/tmp/multi-bin-skill/SKILL.md",
      baseDir: "/tmp/multi-bin-skill",
      skillKey: "multi-bin-skill",
      always: false,
      disabled: false,
      blockedByAllowlist: false,
      eligible: true,
      requirements: {
        bins: [],
        anyBins: ["claude", "codex", "opencode"],
        env: [],
        config: [],
        os: [],
      },
      missing: { bins: [], anyBins: [], env: [], config: [], os: [] },
      configChecks: [],
      install: [],
    };
    const report: SkillStatusReport = {
      workspaceDir: "/tmp",
      managedSkillsDir: "/tmp/managed",
      skills: [entry],
    };

    const output = stripAnsi(formatSkillInfo(report, "multi-bin-skill", {}));
    expect(output).toContain("✓ (any of: claude, codex, opencode)");
    expect(output).not.toContain("✓ codex");
    expect(output).not.toContain("✓ opencode");
  });
});

function createFixtureSkill(params: {
  name: string;
  description: string;
  filePath: string;
  baseDir: string;
  source: string;
}): SkillEntry["skill"] {
  return createCanonicalFixtureSkill(params);
}
