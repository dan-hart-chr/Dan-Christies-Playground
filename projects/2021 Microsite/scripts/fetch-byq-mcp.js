import fs from 'fs-extra';
import fetch from 'node-fetch';

const BYQ_MCP_URL = process.env.BYQ_MCP_URL || 'https://app.byq.supply/api/mcp';
const BYQ_MCP_TOKEN = process.env.BYQ_MCP_TOKEN || '';
// Configurable path templates (relative to BYQ_MCP_URL)
const LIST_PATH = process.env.BYQ_MCP_LIST_PATH || '/packages';
const DOWNLOAD_PATH_TEMPLATE = process.env.BYQ_MCP_DOWNLOAD_PATH || '/packages/{id}/download';

const outDir = 'external/byq';
await fs.ensureDir(outDir);

function downloadPathFor(id) {
  return DOWNLOAD_PATH_TEMPLATE.replace('{id}', encodeURIComponent(id));
}

async function apiGet(path) {
  const url = new URL(path, BYQ_MCP_URL).toString();
  const headers = {};
  if (BYQ_MCP_TOKEN) headers['Authorization'] = `Bearer ${BYQ_MCP_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res;
}

async function listPackages() {
  const res = await apiGet(LIST_PATH);
  const json = await res.json();
  // Support common shapes: array, or { results: [] }, or { packages: [] }
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.packages)) return json.packages;
  // fallback: return object keys
  return Object.keys(json).map(k => ({ id: k, ...json[k] }));
}

async function downloadPackage(pkg) {
  const id = pkg.id || pkg.name || pkg.packageId;
  if (!id) {
    console.warn('Skipping package with no id/name:', pkg);
    return;
  }
  const path = downloadPathFor(id);
  const res = await apiGet(path);
  const buffer = await res.arrayBuffer();
  const filePath = `${outDir}/${id}.tgz`;
  await fs.writeFile(filePath, Buffer.from(buffer));
  console.log('Saved', filePath);
}

async function main() {
  try {
    const pkgs = await listPackages();
    console.log('Found', pkgs.length, 'packages');
    // If user passed an ID as CLI arg, download that only
    const argId = process.argv[2] || process.env.BYQ_COMPONENT_ID;
    if (argId) {
      const match = pkgs.find(p => (p.id === argId) || (p.name === argId));
      if (match) {
        await downloadPackage(match);
        return;
      }
      // If not found, try downloading by id directly
      const res = await apiGet(downloadPathFor(argId));
      const buffer = await res.arrayBuffer();
      const filePath = `${outDir}/${argId}.tgz`;
      await fs.writeFile(filePath, Buffer.from(buffer));
      console.log('Saved', filePath);
      return;
    }
    // Otherwise download all discovered packages (careful: may be many)
    for (const p of pkgs) {
      try {
        await downloadPackage(p);
      } catch (err) {
        console.warn('Failed to download package', p.id || p.name, err.message);
      }
    }
    console.log('BYQ packages fetched to', outDir);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
