import { describe, expect, it } from "vitest";
import { AVATARS, QUESTION_BANK, MAX_WORDS, TOTAL_ROUNDS } from "../shared/game";

// ─── Word counter logic ───────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

describe("Word counter", () => {
  it("counts zero for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("counts zero for whitespace-only string", () => {
    expect(countWords("   ")).toBe(0);
  });

  it("counts single word", () => {
    expect(countWords("hello")).toBe(1);
  });

  it("counts multiple words", () => {
    expect(countWords("I'll tell myself to buy bitcoin")).toBe(6);
  });

  it("handles extra whitespace between words", () => {
    expect(countWords("hello   world")).toBe(2);
  });

  it("MAX_WORDS is 250", () => {
    expect(MAX_WORDS).toBe(250);
  });
});

// ─── Avatar system ────────────────────────────────────────────────────────────

describe("Avatar system", () => {
  it("has at least 6 avatars", () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(6);
  });

  it("all avatars have key, name, and emoji", () => {
    for (const avatar of AVATARS) {
      expect(avatar.key).toBeTruthy();
      expect(avatar.name).toBeTruthy();
      expect(avatar.emoji).toBeTruthy();
    }
  });

  it("all avatar names are uppercase", () => {
    for (const avatar of AVATARS) {
      expect(avatar.name).toBe(avatar.name.toUpperCase());
    }
  });

  it("avatar keys are unique", () => {
    const keys = AVATARS.map((a) => a.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

// ─── Question bank ────────────────────────────────────────────────────────────

describe("Question bank", () => {
  it("has at least 10 questions", () => {
    expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(10);
  });

  it("all questions are non-empty strings", () => {
    for (const q of QUESTION_BANK) {
      expect(typeof q).toBe("string");
      expect(q.length).toBeGreaterThan(0);
    }
  });

  it("TOTAL_ROUNDS is 3", () => {
    expect(TOTAL_ROUNDS).toBe(3);
  });
});

// ─── Vote tallying logic ──────────────────────────────────────────────────────

function tallyVotes(
  votes: Array<{ voterId: string; suspectId: string }>,
  aiPlayerId: string,
  humanCount: number
): { playersWin: boolean; correctVotes: number } {
  const correctVotes = votes.filter((v) => v.suspectId === aiPlayerId).length;
  const playersWin = correctVotes > humanCount / 2;
  return { playersWin, correctVotes };
}

describe("Vote tallying", () => {
  const AI_ID = "ai_player";

  it("players win when majority vote correctly (2/2)", () => {
    const votes = [
      { voterId: "p1", suspectId: AI_ID },
      { voterId: "p2", suspectId: AI_ID },
    ];
    const result = tallyVotes(votes, AI_ID, 2);
    expect(result.playersWin).toBe(true);
    expect(result.correctVotes).toBe(2);
  });

  it("AI wins when no one votes correctly", () => {
    const votes = [
      { voterId: "p1", suspectId: "p2" },
      { voterId: "p2", suspectId: "p1" },
    ];
    const result = tallyVotes(votes, AI_ID, 2);
    expect(result.playersWin).toBe(false);
    expect(result.correctVotes).toBe(0);
  });

  it("AI wins when only 1 out of 2 votes correctly (not majority)", () => {
    const votes = [
      { voterId: "p1", suspectId: AI_ID },
      { voterId: "p2", suspectId: "p1" },
    ];
    // 1 > 2/2 = 1 > 1 = false, so AI wins on tie
    const result = tallyVotes(votes, AI_ID, 2);
    expect(result.playersWin).toBe(false);
    expect(result.correctVotes).toBe(1);
  });
});

// ─── Room code generation ─────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

describe("Room code generation", () => {
  it("generates a 6-character code", () => {
    const code = generateRoomCode();
    expect(code.length).toBe(6);
  });

  it("only contains valid characters (no ambiguous 0, O, 1, I)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 100 }, generateRoomCode));
    expect(codes.size).toBeGreaterThan(90); // very high probability
  });
});

// ─── Auth logout test (from template) ────────────────────────────────────────

import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});
