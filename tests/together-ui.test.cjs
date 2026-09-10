const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = path => readFileSync(path, "utf8");

test("together feed describes participating neighbors without a percentage gauge", () => {
  const source = read("src/app/carrot/components/together/TogetherFeedCard.tsx");

  assert.match(source, /같이 참여하는 이웃/);
  assert.match(source, /자리 남았어요/);
  assert.match(source, /aria-describedby=\{neighborSummaryId\}/);
  assert.doesNotMatch(source, /progressPercent|togetherProgressBar|togetherProgressFill|%/);
});

test("together detail uses a semantic neighbor list and handles cancelled meetings", () => {
  const source = read("src/app/carrot/components/together/TogetherDetailView.tsx");

  assert.match(source, /<ul className=\{styles\.togetherParticipantList\}/);
  assert.match(source, /<li key=\{`\$\{p\.userId\}-\$\{idx\}`\}/);
  assert.match(source, /const isCancelled = post\.status === "cancelled"/);
  assert.match(source, /취소된 모임/);
  assert.doesNotMatch(source, /progressPercent|togetherProgressBar|togetherProgressFill|togetherPercentBadge|%/);
});
