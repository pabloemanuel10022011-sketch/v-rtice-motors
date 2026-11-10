const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = __dirname;
const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function jsonResponse(response, status, message) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify({ error: message }));
}

function createApp() {
  return http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return jsonResponse(response, 404, "Rota não encontrada.");
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
      return jsonResponse(response, 400, "Endereço inválido.");
    }

    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const isPublicAsset = relativePath === "index.html" ||
      ["css/", "images/", "js/"].some((directory) => relativePath.startsWith(directory));
    if (!isPublicAsset || relativePath.split(/[\\/]/).some((part) => part.startsWith("."))) {
      return jsonResponse(response, 404, "Arquivo não encontrado.");
    }

    const filePath = path.resolve(ROOT, relativePath);
    if (!filePath.startsWith(ROOT + path.sep)) {
      return jsonResponse(response, 404, "Arquivo não encontrado.");
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        return jsonResponse(response, error.code === "ENOENT" ? 404 : 500, "Não foi possível carregar o arquivo.");
      }

      response.writeHead(200, {
        "Content-Type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff"
      });
      if (request.method === "HEAD") return response.end();
      response.end(content);
    });
  });
}

if (require.main === module) {
  const server = createApp();
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => {
    console.log("Vértice Motors disponível em http://localhost:" + port);
  });
}

module.exports = { createApp };
