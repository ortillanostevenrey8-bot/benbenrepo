import { searchWalastikWebsite } from "./walastikWebsiteSearch";

describe("searchWalastikWebsite", () => {
  test("finds official founder information without claiming ISP ownership", () => {
    const [result] = searchWalastikWebsite("Who is the owner of Walastik?");

    expect(result.title).toBe("Founder and leadership");
    expect(result.details).toContain("does not explicitly identify the owner of Walastik Internet");
    expect(result.sourceUrls).toContain("https://walastik.bfdenterprises.com/about");
  });

  test("finds official modem support topics", () => {
    const [result] = searchWalastikWebsite("How do I change my ZTE wifi password?");

    expect(result.title).toBe("Wi-Fi name or password guides");
    expect(result.details).toContain("ZTE Router Versions 1 and 2");
  });

  test("returns no result when the official site has no matching fact", () => {
    expect(searchWalastikWebsite("What are the internet plan prices?")).toEqual([]);
  });

  test("returns the official company overview for a general company question", () => {
    const [result] = searchWalastikWebsite("What is Walastik?");

    expect(result.title).toBe("Company overview");
  });
});
