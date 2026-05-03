import { describe, it, expect, beforeEach, vi } from "vitest";
import { timeAgo } from "../lib/timeAgo";

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  it("returns 'just now' for timestamps within the last minute", () => {
    const now = new Date("2024-06-15T12:00:00Z");
    expect(timeAgo(now)).toBe("just now");

    const thirtySecsAgo = new Date("2024-06-15T11:59:30Z");
    expect(timeAgo(thirtySecsAgo)).toBe("just now");

    const fiftyNineSecsAgo = new Date("2024-06-15T11:59:01Z");
    expect(timeAgo(fiftyNineSecsAgo)).toBe("just now");
  });

  it("returns minutes for timestamps 1-59 minutes ago", () => {
    const oneMinAgo = new Date("2024-06-15T11:59:00Z");
    expect(timeAgo(oneMinAgo)).toBe("1m ago");

    const tenMinsAgo = new Date("2024-06-15T11:50:00Z");
    expect(timeAgo(tenMinsAgo)).toBe("10m ago");

    const fiftyNineMinsAgo = new Date("2024-06-15T11:01:00Z");
    expect(timeAgo(fiftyNineMinsAgo)).toBe("59m ago");
  });

  it("returns hours for timestamps 1-23 hours ago", () => {
    const oneHourAgo = new Date("2024-06-15T11:00:00Z");
    expect(timeAgo(oneHourAgo)).toBe("1h ago");

    const fiveHoursAgo = new Date("2024-06-15T07:00:00Z");
    expect(timeAgo(fiveHoursAgo)).toBe("5h ago");

    const twentyThreeHoursAgo = new Date("2024-06-14T13:00:00Z");
    expect(timeAgo(twentyThreeHoursAgo)).toBe("23h ago");
  });

  it("returns days for timestamps 1+ days ago", () => {
    const oneDayAgo = new Date("2024-06-14T12:00:00Z");
    expect(timeAgo(oneDayAgo)).toBe("1d ago");

    const threeDaysAgo = new Date("2024-06-12T12:00:00Z");
    expect(timeAgo(threeDaysAgo)).toBe("3d ago");

    const thirtyDaysAgo = new Date("2024-05-16T12:00:00Z");
    expect(timeAgo(thirtyDaysAgo)).toBe("30d ago");
  });

  it("handles exactly one hour boundary", () => {
    const exactlyOneHourAgo = new Date("2024-06-15T11:00:00Z");
    expect(timeAgo(exactlyOneHourAgo)).toBe("1h ago");
  });

  it("handles exactly one day boundary", () => {
    const exactlyOneDayAgo = new Date("2024-06-14T12:00:00Z");
    expect(timeAgo(exactlyOneDayAgo)).toBe("1d ago");
  });
});
