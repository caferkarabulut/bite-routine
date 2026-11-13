import { addDays, daysBetween, isValidLocalDate, todayInIstanbul, weekRange } from "../src/domain";

describe("todayInIstanbul", () => {
  it("is already the next day after 21:00 UTC", () => {
    expect(todayInIstanbul(new Date("2026-11-12T21:30:00Z"))).toBe("2026-11-13");
  });

  it("is still the same day just before 21:00 UTC", () => {
    expect(todayInIstanbul(new Date("2026-11-12T20:59:59Z"))).toBe("2026-11-12");
    expect(todayInIstanbul(new Date("2026-11-12T21:00:00Z"))).toBe("2026-11-13");
  });

  it("crosses year boundaries", () => {
    expect(todayInIstanbul(new Date("2026-12-31T21:00:00Z"))).toBe("2027-01-01");
  });

  it("uses UTC+3 in summer as well", () => {
    expect(todayInIstanbul(new Date("2026-07-15T20:59:00Z"))).toBe("2026-07-15");
    expect(todayInIstanbul(new Date("2026-07-15T21:00:00Z"))).toBe("2026-07-16");
  });

  it("defaults to now", () => {
    expect(isValidLocalDate(todayInIstanbul())).toBe(true);
  });
});

describe("addDays / daysBetween", () => {
  it("crosses month, year and leap boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-11-13", 0)).toBe("2026-11-13");
    expect(addDays("2026-11-13", 365)).toBe("2027-11-13");
  });

  it("computes signed differences", () => {
    expect(daysBetween("2026-11-13", "2026-11-20")).toBe(7);
    expect(daysBetween("2026-11-20", "2026-11-13")).toBe(-7);
    expect(daysBetween("2026-11-13", "2026-11-13")).toBe(0);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("rejects malformed dates", () => {
    expect(() => addDays("13.11.2026", 1)).toThrow(RangeError);
  });
});

describe("weekRange", () => {
  it("returns 7 ascending days ending at endDate", () => {
    expect(weekRange("2026-11-13")).toEqual([
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
    ]);
  });

  it("works across a month end", () => {
    expect(weekRange("2026-03-03")).toEqual([
      "2026-02-25",
      "2026-02-26",
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
    ]);
  });

  it("works across a year end", () => {
    const week = weekRange("2027-01-02");
    expect(week[0]).toBe("2026-12-27");
    expect(week[6]).toBe("2027-01-02");
  });
});

describe("isValidLocalDate", () => {
  it.each(["2026-11-13", "2028-02-29", "2026-12-31"])("accepts %s", (d) => {
    expect(isValidLocalDate(d)).toBe(true);
  });

  it.each(["2027-02-29", "2026-02-30", "2026-13-01", "2026-00-10", "2026-11-00", "2026-1-1", "13-11-2026", "", "2026-11-13T00:00"])(
    "rejects %j",
    (d) => {
      expect(isValidLocalDate(d)).toBe(false);
    },
  );

  it("rejects non-strings", () => {
    expect(isValidLocalDate(20261113)).toBe(false);
    expect(isValidLocalDate(null)).toBe(false);
  });
});
