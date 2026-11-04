const test = require("node:test");
const assert = require("node:assert/strict");
const {
  chunkSegments,
  getSearchTerms,
  rankChunks,
  segmentsFromText,
} = require("./rag");

test("splits text into overlapping chunks and keeps section labels", () => {
  const chunks = chunkSegments(segmentsFromText(
    `# Router setup\n${"Configure the router safely. ".repeat(100)}`
  ));

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.section === "Router setup"));
  assert.ok(chunks.every((chunk) => chunk.keywords.includes("router")));
  assert.ok(chunks[0].content.includes(chunks[1].content.slice(0, 100)));
});

test("ranks matching chunks and excludes irrelevant content", () => {
  const chunks = chunkSegments([
    { section: "Setup", text: "Reset the ZTE router password in the Wi-Fi settings." },
    { section: "Billing", text: "Office hours are Monday through Friday." },
  ]);

  const results = rankChunks(chunks, "How can I reset my ZTE router password?");

  assert.equal(results.length, 1);
  assert.equal(results[0].section, "Setup");
  assert.deepEqual(getSearchTerms("the and is"), []);
});
