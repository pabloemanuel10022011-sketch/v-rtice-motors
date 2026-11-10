const assert = require("node:assert/strict");
const test = require("node:test");
const { createApp } = require("../server");

test("serves the site and public assets without exposing server files", async () => {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = "http://127.0.0.1:" + server.address().port;

  try {
    const pageResponse = await fetch(origin + "/");
    assert.equal(pageResponse.status, 200);
    const page = await pageResponse.text();
    assert.match(page, /site_brand_name">Vértice <strong>Motors<\/strong>/);
    assert.match(page, /Seu próximo destino começa aqui\./);
    assert.match(page, /id="contactForm"/);
    assert.match(page, /mailto:contato@sonhovivo\.com\.br/);
    assert.doesNotMatch(page, /fetch\(["']\/api\/contact/);
    assert.equal((await fetch(origin + "/css/style.css")).status, 200);
    assert.equal((await fetch(origin + "/server.js")).status, 404);
    assert.equal((await fetch(origin + "/.env")).status, 404);
    assert.equal((await fetch(origin + "/api/contact", { method: "POST" })).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
