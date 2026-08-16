const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

let PORT = process.env.PORT || 5000;
const DECISIONS_DIR = "D:\\Decisions";

function sanitizeFilename(name) {
  name = name.replace(/[\\/*?:"<>|]/g, '');
  name = name.replace(/\.\.+/g, '');
  return name.trim();
}

function getItemTextWeight(item) {
  if (typeof item === 'object' && item !== null) {
    return {
      text: (item.text || "").trim(),
      weight: Number(item.weight) || 1
    };
  }
  return {
    text: String(item).trim(),
    weight: 1
  };
}

function ensureDefaultData() {
  if (!fs.existsSync(DECISIONS_DIR)) {
    fs.mkdirSync(DECISIONS_DIR, { recursive: true });
  }

  const items = fs.readdirSync(DECISIONS_DIR);
  let hasDirs = false;
  for (const item of items) {
    const itemPath = path.join(DECISIONS_DIR, item);
    if (fs.statSync(itemPath).isDirectory()) {
      hasDirs = true;
      break;
    }
  }

  if (!hasDirs) {
    fs.mkdirSync(path.join(DECISIONS_DIR, "Drafts"), { recursive: true });
    fs.mkdirSync(path.join(DECISIONS_DIR, "Career"), { recursive: true });
    fs.mkdirSync(path.join(DECISIONS_DIR, "Relationships"), { recursive: true });
    fs.mkdirSync(path.join(DECISIONS_DIR, "Health"), { recursive: true });
  }
}

function loadStateFromDisk() {
  ensureDefaultData();

  const categories = [];
  const draftsCat = { name: "Drafts", decisions: [] };
  categories.push(draftsCat);

  const items = fs.readdirSync(DECISIONS_DIR);
  const catNames = items.filter(item => {
    const itemPath = path.join(DECISIONS_DIR, item);
    return fs.statSync(itemPath).isDirectory() && item !== "backups";
  }).sort();

  for (const catName of catNames) {
    const catPath = path.join(DECISIONS_DIR, catName);
    const decisions = [];
    const files = fs.readdirSync(catPath);

    for (const fileName of files) {
      if (fileName.endsWith('.md')) {
        const decPath = path.join(catPath, fileName);
        const stats = fs.statSync(decPath);
        const decId = "dec_" + Math.floor(stats.mtimeMs);
        const topic = fileName.slice(0, -3);
        let pros = [];
        let cons = [];
        let passwordHash = "";

        try {
          const content = fs.readFileSync(decPath, 'utf8');

          const pwMatch = content.match(/<!-- password_hash:\s*(.*?)\s*-->/);
          if (pwMatch) {
            passwordHash = pwMatch[1].trim();
          }

          const advMatch = content.match(/## Advantages\r?\n([\s\S]*?)(?=\r?\n## Disadvantages|$)/);
          const disMatch = content.match(/## Disadvantages\r?\n([\s\S]*)$/);

          if (advMatch) {
            const lines = advMatch[1].split(/\r?\n/);
            for (let line of lines) {
              line = line.replace(/^\d+\.\s*/, '').trim();
              if (line) {
                const m = line.match(/^\[(\d+)x\]\s*(.*)/);
                if (m) {
                  pros.push({ text: m[2].trim(), weight: parseInt(m[1], 10) });
                } else {
                  pros.push({ text: line, weight: 1 });
                }
              }
            }
          }

          if (disMatch) {
            const lines = disMatch[1].split(/\r?\n/);
            for (let line of lines) {
              line = line.replace(/^\d+\.\s*/, '').trim();
              if (line) {
                const m = line.match(/^\[(\d+)x\]\s*(.*)/);
                if (m) {
                  cons.push({ text: m[2].trim(), weight: parseInt(m[1], 10) });
                } else {
                  cons.push({ text: line, weight: 1 });
                }
              }
            }
          }
        } catch (e) {
          console.error("Error parsing file:", fileName, e);
        }

        if (pros.length === 0) pros.push({ text: "", weight: 1 });
        if (cons.length === 0) cons.push({ text: "", weight: 1 });

        decisions.push({
          id: decId,
          topic: topic,
          pros: pros,
          cons: cons,
          passwordHash: passwordHash
        });
      }
    }

    if (catName === 'Drafts') {
      draftsCat.decisions = decisions;
    } else {
      categories.push({
        name: catName,
        decisions: decisions
      });
    }
  }

  if (draftsCat.decisions.length === 0) {
    draftsCat.decisions.push({
      id: "dec_draft_default",
      topic: "",
      pros: [{ text: "", weight: 1 }],
      cons: [{ text: "", weight: 1 }]
    });
  }

  return { categories };
}

function isReservedName(name) {
  const reserved = new Set([
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
  ]);
  return reserved.has(name.toUpperCase());
}

function validateState(state) {
  if (typeof state !== 'object' || state === null) return false;
  if (!Array.isArray(state.categories)) return false;
  for (const cat of state.categories) {
    if (typeof cat !== 'object' || cat === null || typeof cat.name !== 'string' || !Array.isArray(cat.decisions)) return false;
    const catName = cat.name.trim();
    if (!catName || isReservedName(catName) || catName.includes("..") || catName.includes("/") || catName.includes("\\")) return false;
    for (const dec of cat.decisions) {
      if (typeof dec !== 'object' || dec === null || typeof dec.topic !== 'string' || !Array.isArray(dec.pros) || !Array.isArray(dec.cons)) return false;
      const topic = dec.topic.trim();
      if (isReservedName(topic) || topic.includes("..") || topic.includes("/") || topic.includes("\\")) return false;
    }
  }
  return true;
}

function writeMarkdownFile(filePath, topic, catName, pros, cons, passwordHash) {
  const tempPath = filePath + ".tmp";
  try {
    let content = `# Decision: ${topic} (${catName})\n`;
    if (passwordHash) {
      content += `<!-- password_hash: ${passwordHash} -->\n`;
    }
    content += `\n## Advantages\n`;
    pros.forEach((pro, i) => {
      const { text, weight } = getItemTextWeight(pro);
      if (text) {
        if (weight > 1) {
          content += `${i + 1}. [${weight}x] ${text}\n`;
        } else {
          content += `${i + 1}. ${text}\n`;
        }
      }
    });
    content += `\n## Disadvantages\n`;
    cons.forEach((con, i) => {
      const { text, weight } = getItemTextWeight(con);
      if (text) {
        if (weight > 1) {
          content += `${i + 1}. [${weight}x] ${text}\n`;
        } else {
          content += `${i + 1}. ${text}\n`;
        }
      }
    });

    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (e) {}
    }
    throw err;
  }
}

function saveStateToDisk(state) {
  if (!validateState(state)) {
    throw new Error("Invalid state payload structure");
  }

  if (!fs.existsSync(DECISIONS_DIR)) {
    fs.mkdirSync(DECISIONS_DIR, { recursive: true });
  }

  const backupsDir = path.join(DECISIONS_DIR, "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const backupFile = path.join(backupsDir, `state_backup_${timestamp}.json`);
  try {
    fs.writeFileSync(backupFile, JSON.stringify(state, null, 4), 'utf8');
    
    const backupFiles = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith("state_backup_") && f.endsWith(".json"))
      .map(f => ({
        name: f,
        path: path.join(backupsDir, f),
        mtime: fs.statSync(path.join(backupsDir, f)).mtimeMs
      }))
      .sort((a, b) => a.mtime - b.mtime);

    while (backupFiles.length >= 20) {
      const oldest = backupFiles.shift();
      fs.unlinkSync(oldest.path);
    }
  } catch (e) {
    console.error("Backup error:", e);
  }

  const activeCats = new Set(state.categories.map(c => c.name));
  const existingItems = fs.readdirSync(DECISIONS_DIR);
  for (const item of existingItems) {
    if (item === "backups") continue;
    const catPath = path.join(DECISIONS_DIR, item);
    if (fs.statSync(catPath).isDirectory()) {
      if (!activeCats.has(item)) {
        try {
          fs.rmSync(catPath, { recursive: true, force: true });
        } catch (e) {
          console.error("Error deleting folder:", catPath, e);
        }
      } else {
        const files = fs.readdirSync(catPath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            try {
              fs.unlinkSync(path.join(catPath, file));
            } catch (e) {
              console.error("Error deleting file:", file, e);
            }
          }
        }
      }
    }
  }

  for (const cat of state.categories) {
    const catName = cat.name;
    const catPath = path.join(DECISIONS_DIR, catName);
    if (!fs.existsSync(catPath)) {
      fs.mkdirSync(catPath, { recursive: true });
    }

    for (const dec of cat.decisions) {
      const topic = dec.topic.trim();
      if (!topic) continue;

      const fileName = sanitizeFilename(topic) + ".md";
      const filePath = path.join(catPath, fileName);

      writeMarkdownFile(filePath, topic, catName, dec.pros, dec.cons, dec.passwordHash);
    }
  }
}

function autoBundle(appDir) {
  try {
    const indexPath = path.join(appDir, "index.html");
    const cssPath = path.join(appDir, "styles.css");
    const jsPath = path.join(appDir, "app.js");
    const outPath = path.join(appDir, "DecisionHelper.html");

    if (!fs.existsSync(indexPath) || !fs.existsSync(cssPath) || !fs.existsSync(jsPath)) {
      return;
    }

    const mtimeIndex = fs.statSync(indexPath).mtimeMs;
    const mtimeCss = fs.statSync(cssPath).mtimeMs;
    const mtimeJs = fs.statSync(jsPath).mtimeMs;

    let mtimeOut = 0;
    if (fs.existsSync(outPath)) {
      mtimeOut = fs.statSync(outPath).mtimeMs;
    }

    if (Math.max(mtimeIndex, mtimeCss, mtimeJs) > mtimeOut) {
      let html = fs.readFileSync(indexPath, "utf8");
      const css = fs.readFileSync(cssPath, "utf8");
      const js = fs.readFileSync(jsPath, "utf8");

      const cssTag = `<style>\n${css}\n</style>`;
      const cssRegex = /<link rel="stylesheet" href="styles\.css[^"]*">/;
      html = html.replace(cssRegex, cssTag);

      const jsTag = `<script>\n${js}\n</script>`;
      const jsRegex = /<script src="app\.js[^"]*"><\/script>/;
      html = html.replace(jsRegex, jsTag);

      fs.writeFileSync(outPath, html, "utf8");
    }
  } catch (err) {
    console.error("Auto bundle error:", err);
  }
}

function getGeminiKey(appDir) {
  let key = process.env.GEMINI_API_KEY;
  if (!key) {
    const secretsPath = path.join(appDir, "secrets.json");
    if (fs.existsSync(secretsPath)) {
      try {
        const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
        key = secrets.gemini_api_key;
      } catch (e) {
        console.error("Error reading secrets.json:", e);
      }
    }
  }
  if (key === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
    return null;
  }
  return key || null;
}

function callGemini(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const dataStr = JSON.stringify(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      },
      timeout: 15000
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response JSON: ${e.message}. Body: ${body}`));
          }
        } else {
          reject(new Error(`Gemini API returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(dataStr);
    req.end();
  });
}

// Load port from config.json if exists
try {
  const configPath = path.join(__dirname, "config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (config.port) {
      PORT = Number(config.port);
    }
  }
} catch (e) {}

const server = http.createServer(async (req, res) => {
  const requestOrigin = req.headers.origin || `http://localhost:${PORT}`;
  
  res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET') {
    if (pathname === '/api/load') {
      try {
        const state = loadStateFromDisk();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(err.message);
      }
      return;
    }

    autoBundle(__dirname);
    let filePath = pathname.slice(1);
    if (!filePath) {
      filePath = 'index.html';
    }

    const fullPath = path.resolve(path.join(__dirname, filePath));
    if (!fullPath.startsWith(path.resolve(__dirname))) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end("Forbidden: Directory traversal blocked");
      return;
    }

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      fs.createReadStream(fullPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end("File not found");
    }
  } else if (req.method === 'POST') {
    const readBody = () => new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
    });

    if (pathname === '/api/save') {
      try {
        const body = await readBody();
        const state = JSON.parse(body);
        saveStateToDisk(state);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "success" }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(err.message);
      }
      return;
    }

    if (pathname === '/api/suggest') {
      try {
        const body = await readBody();
        const payload = JSON.parse(body);
        const topic = (payload.topic || "").trim();
        if (!topic) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Topic cannot be empty" }));
          return;
        }

        const geminiKey = getGeminiKey(__dirname);
        if (!geminiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: "Gemini API key is not configured. Please paste your key in secrets.json to enable AI suggestions."
          }));
          return;
        }

        const prompt = `You are a neutral Decision Counselor. Suggest a balanced list of advantages (pros) and disadvantages (cons) for the following topic: '${topic}'.\n\nYour response MUST be a valid JSON object matching this schema exactly:\n{\n  "pros": [string, string, ...],\n  "cons": [string, string, ...]\n}\nDo not include any markdown tags, trailing commas, or other text outside the JSON object. Provide up to 8 items in each list. Each item should be a concise, realistic, and complete sentence.`;

        const apiPayload = {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        };

        const resData = await callGemini(geminiKey, apiPayload);
        let textContent = resData.candidates[0].content.parts[0].text;
        if (textContent.includes("```")) {
          textContent = textContent.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
        }

        const suggestions = JSON.parse(textContent.trim());
        if (!suggestions.pros) suggestions.pros = [];
        if (!suggestions.cons) suggestions.cons = [];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(suggestions));
      } catch (err) {
        console.error("Error handling /api/suggest:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (pathname === '/api/chat') {
      try {
        const body = await readBody();
        const payload = JSON.parse(body);
        const topic = (payload.topic || "").trim();
        const pros = payload.pros || [];
        const cons = payload.cons || [];
        const suggestedPros = payload.suggested_pros || [];
        const suggestedCons = payload.suggested_cons || [];
        const history = payload.history || [];
        const message = (payload.message || "").trim();

        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Message cannot be empty" }));
          return;
        }

        const geminiKey = getGeminiKey(__dirname);
        if (!geminiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: "Gemini API key is not configured. Please paste your key in secrets.json to enable AI chat."
          }));
          return;
        }

        const prosStr = pros.map(p => {
          const { text, weight } = getItemTextWeight(p);
          return text ? `- ${text} (Weight: ${weight})` : '';
        }).filter(Boolean).join('\n');

        const consStr = cons.map(c => {
          const { text, weight } = getItemTextWeight(c);
          return text ? `- ${text} (Weight: ${weight})` : '';
        }).filter(Boolean).join('\n');

        const suggProsStr = suggestedPros.map(p => `- ${p}`).join('\n');
        const suggConsStr = suggestedCons.map(c => `- ${c}`).join('\n');

        const systemInstruction = `You are a helpful, neutral, and objective Decision Counselor Chat Assistant. The user is evaluating a decision on the topic described below. You must help them think through trade-offs, clarify points, evaluate weights, or suggest new angles, but never make the decision for them.\n\nDecision Topic: '${topic}'\n\nCurrent Advantages (Pros) on the workspace:\n${prosStr || 'None yet'}\n\nCurrent Disadvantages (Cons) on the workspace:\n${consStr || 'None yet'}\n\nAI Suggestions shown to the user in this session:\nSuggested Pros:\n${suggProsStr || 'None'}\nSuggested Cons:\n${suggConsStr || 'None'}\n\nYou should provide highly detailed, comprehensive, and well-thought-out explanations when asked. Do not artificially limit the length or depth of your chat responses. Respond naturally, thoroughly, and analytically, offering deep insights, structural details, and actionable guidance based on their questions.`;

        const contents = history.map(h => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text || "" }]
        }));

        contents.push({
          role: "user",
          parts: [{ text: message }]
        });

        const apiPayload = {
          contents: contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          }
        };

        const resData = await callGemini(geminiKey, apiPayload);
        const textContent = resData.candidates[0].content.parts[0].text;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: textContent }));
      } catch (err) {
        console.error("Error handling /api/chat:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html';
  if (ext === '.css') return 'text/css';
  if (ext === '.js') return 'application/javascript';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

server.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`Decision Server Running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server.`);
  console.log(`==========================================\n`);
});
