const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = path => readFileSync(path, "utf8");

test("community service keeps the post interaction API contract", () => {
  const source = read("src/services/communityService.ts");

  assert.match(source, /authorizedFetch\(`\/api\/v1\/community\/posts\/\$\{postId\}\/emotion`/);
  assert.match(source, /method:\s*"POST"/);
  assert.match(source, /reaction_count/);
  assert.match(source, /reactionCount:\s*payload\.reaction_count/);

  assert.match(source, /fetch\(apiUrl\(`\/api\/v1\/community\/posts\/\$\{postId\}\/comments`/);
  assert.match(source, /authorizedFetch\(`\/api\/v1\/community\/posts\/\$\{postId\}\/comments`/);
  assert.match(source, /authorizedFetch\(`\/api\/v1\/community\/posts\/\$\{postId\}\/comments\/\$\{commentId\}`/);
  assert.match(source, /method:\s*"DELETE"/);

  assert.doesNotMatch(source, /\/hide\b/);
});

test("community feed renders reactions with a heart separate from comments", () => {
  const source = read("src/app/carrot/components/community/CommunityScreen.tsx");

  assert.match(source, /import[\s\S]*Heart[\s\S]*from "lucide-react"/);
  assert.match(source, /post\.reactionCount > 0[\s\S]*<Heart size=\{15\}/);
  assert.match(source, /fill=\{post\.isReacted \? "currentColor" : "none"\}/);
  assert.match(source, /post\.commentCount > 0[\s\S]*<MessageCircle size=\{15\}/);
  assert.match(source, /styles\.communityStatActive/);
  assert.doesNotMatch(source, /onPostHide/);
});

test("community detail screen wires the emotion button and comments", () => {
  const source = read("src/app/carrot/components/community/CommunityDetailScreen.tsx");

  assert.match(source, /onToggleEmotion:\s*\(\) => void/);
  assert.match(source, /onSubmitComment:\s*\(event: FormEvent<HTMLFormElement>\) => void/);
  assert.match(source, /className=\{post\.isReacted \? styles\.reactionActive : ""\}/);
  assert.match(source, /<Heart size=\{19\}/);
  assert.match(source, /comments\.map\(\(comment\)/);
  assert.doesNotMatch(source, /onHide/);
});
