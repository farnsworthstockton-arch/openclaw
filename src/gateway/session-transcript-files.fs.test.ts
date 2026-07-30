import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupArchivedSessionTranscripts } from "./session-transcript-files.fs.js";

function archivedName(nowMs: number, ageMs: number, suffix: string): string {
  const timestamp = new Date(nowMs - ageMs).toISOString().replaceAll(":", "-");
  return `session-${suffix}.jsonl.deleted.${timestamp}`;
}

describe("cleanupArchivedSessionTranscripts", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "openclaw-session-transcript-cleanup-"),
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it("only counts a file as removed when the delete actually succeeds", async () => {
    const now = Date.now();
    const olderThanMs = 60_000;

    const keepPath = path.join(tmpDir, archivedName(now, olderThanMs + 10_000, "ok"));
    const failPath = path.join(tmpDir, archivedName(now, olderThanMs + 10_000, "fails-to-delete"));
    await fs.promises.writeFile(keepPath, "{}");
    await fs.promises.writeFile(failPath, "{}");

    const originalRm = fs.promises.rm.bind(fs.promises);
    vi.spyOn(fs.promises, "rm").mockImplementation(async (target, ...rest) => {
      if (target === failPath) {
        throw new Error("simulated EPERM removing transcript");
      }
      return originalRm(target, ...(rest as []));
    });

    const result = await cleanupArchivedSessionTranscripts({
      directories: [tmpDir],
      olderThanMs,
      nowMs: now,
    });

    // Both files were scanned (matched the archive-name pattern and were old enough
    // to be eligible for deletion), but only the one that actually succeeded should
    // be counted as removed.
    expect(result.scanned).toBe(2);
    expect(result.removed).toBe(1);

    // The successfully-removed file is gone; the failed one is left in place so it's
    // retried on the next sweep instead of being silently dropped from disk-accounting.
    await expect(fs.promises.stat(keepPath)).rejects.toThrow();
    await expect(fs.promises.stat(failPath)).resolves.toBeDefined();
  });

  it("counts a successful delete as removed", async () => {
    const now = Date.now();
    const olderThanMs = 60_000;
    const filePath = path.join(tmpDir, archivedName(now, olderThanMs + 10_000, "ok"));
    await fs.promises.writeFile(filePath, "{}");

    const result = await cleanupArchivedSessionTranscripts({
      directories: [tmpDir],
      olderThanMs,
      nowMs: now,
    });

    expect(result.scanned).toBe(1);
    expect(result.removed).toBe(1);
    await expect(fs.promises.stat(filePath)).rejects.toThrow();
  });
});
