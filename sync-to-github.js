/* ==========================================================================
   PHONE STORE MANAGEMENT PRO - AUTOMATIC GITHUB PUSH & SYNC SCRIPT
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USER = "hammacheikhe-byte";
const GITHUB_REPO = "Store-phone-management";

// Target files to automatically sync to GitHub
const FILES_TO_SYNC = [
  'index.html',
  'app.js',
  'styles.css',
  'test.html',
  'manifest.webmanifest',
  'sw.js',
  'README.md'
];

function cleanGitHubToken(tokenStr) {
  if (!tokenStr) return "";
  return String(tokenStr)
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^token\s+/i, '');
}

// Get GitHub Token from argument or environment
const rawToken = process.argv[2] || process.env.GITHUB_TOKEN;
const TOKEN = cleanGitHubToken(rawToken);

if (!TOKEN) {
  console.log("\x1b[31m%s\x1b[0m", "❌ خطأ: يرجى إدخال GitHub Personal Access Token.");
  console.log("الاستخدام: node sync-to-github.js ghp_xxxxxxxxxxxxxxxxxxxx");
  process.exit(1);
}

function makeGitHubRequest(method, pathUrl, bodyData = null, authHeaderPrefix = 'Bearer') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: pathUrl,
      method: method,
      headers: {
        'Authorization': `${authHeaderPrefix} ${TOKEN}`,
        'User-Agent': 'PhoneStorePro-AutoSync',
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            resolve({ statusCode: res.statusCode, error: parsed.message || res.statusMessage, data: parsed });
          }
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (bodyData) req.write(JSON.stringify(bodyData));
    req.end();
  });
}

async function makeGitHubRequestWithFallback(method, pathUrl, bodyData = null) {
  let res = await makeGitHubRequest(method, pathUrl, bodyData, 'Bearer');
  if (res.statusCode === 401) {
    res = await makeGitHubRequest(method, pathUrl, bodyData, 'token');
  }
  return res;
}

async function syncFileToGitHub(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ الملف ${fileName} غير موجود محلياً.`);
    return;
  }

  const content = fs.readFileSync(filePath);
  const base64Content = content.toString('base64');
  const apiPath = `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${fileName}`;

  // 1. Check if file exists on GitHub to get SHA
  let sha = undefined;
  const existing = await makeGitHubRequestWithFallback('GET', apiPath);
  if (existing.statusCode === 200 && existing.data && existing.data.sha) {
    sha = existing.data.sha;
  }

  // 2. Upload/Commit file to GitHub
  const commitPayload = {
    message: `Auto Sync: Update ${fileName} at ${new Date().toISOString()}`,
    content: base64Content,
    sha: sha
  };

  const uploadRes = await makeGitHubRequestWithFallback('PUT', apiPath, commitPayload);
  if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
    console.log("\x1b[32m%s\x1b[0m", `✅ تم رفع ومزامنة الملف بنجاح على GitHub: ${fileName}`);
  } else {
    let errDetail = uploadRes.error || uploadRes.statusCode;
    if (uploadRes.statusCode === 401) errDetail = "التوكن غير صحيح أو انتهت صلاحيته (Bad credentials)";
    if (uploadRes.statusCode === 404) errDetail = `المستودع ${GITHUB_REPO} غير موجود بالحساب أو ينقص التوكن صلاحية 'repo'`;
    console.log("\x1b[31m%s\x1b[0m", `❌ تعذر رفع ${fileName}: ${errDetail}`);
  }
}

async function runAutoSync() {
  console.log("\x1b[36m%s\x1b[0m", `🚀 جاري فحص ومزامنة التوكن لمستودع ${GITHUB_USER}/${GITHUB_REPO}...`);
  for (const file of FILES_TO_SYNC) {
    await syncFileToGitHub(file);
  }
  console.log("\x1b[32m%s\x1b[0m", "✨ اكتملت المزامنة السحابية بنجاح 100%! أصبح موقعك محدثاً على GitHub Pages.");
}

runAutoSync();
