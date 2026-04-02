import { getCache, setCache, clearCache, clearAllCache } from "@/utils/fetchCache";

describe("fetchCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearAllCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for missing key", () => {
    expect(getCache("missing", 60_000)).toBeNull();
  });

  it("stores and retrieves data", () => {
    setCache("key1", { foo: "bar" });
    expect(getCache("key1", 60_000)).toEqual({ foo: "bar" });
  });

  it("returns null after TTL expiry", () => {
    setCache("key2", "data");
    vi.advanceTimersByTime(60_001);
    expect(getCache("key2", 60_000)).toBeNull();
  });

  it("clearCache removes specific entry", () => {
    setCache("a", 1);
    setCache("b", 2);
    clearCache("a");
    expect(getCache("a", 60_000)).toBeNull();
    expect(getCache("b", 60_000)).toBe(2);
  });

  it("clearAllCache removes all entries", () => {
    setCache("x", 10);
    setCache("y", 20);
    clearAllCache();
    expect(getCache("x", 60_000)).toBeNull();
    expect(getCache("y", 60_000)).toBeNull();
  });

  it("different staleTime values work correctly", () => {
    setCache("short", "val");
    vi.advanceTimersByTime(3_000);
    // 2s TTL → expired
    expect(getCache("short", 2_000)).toBeNull();
    // Re-set and check with longer TTL
    setCache("long", "val");
    vi.advanceTimersByTime(3_000);
    // 10s TTL → still fresh
    expect(getCache("long", 10_000)).toBe("val");
  });
});
