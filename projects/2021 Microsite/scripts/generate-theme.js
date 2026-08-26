import fs from 'fs-extra';
import path from 'path';

// Point to the workspace's canonical design-system tokens
const tokensPath = path.resolve(__dirname, '../../design-system/tokens.json');
const mappingPath = path.resolve(__dirname, '../design-system/token-mapping/byq-to-christies.json');
const outCss = path.resolve(process.cwd(), 'dist/christies-theme.css');
const outJson = path.resolve(process.cwd(), 'dist/christies-theme.json');

function get(obj, addr) {
  if (!addr) return undefined;
  return addr.split('.').reduce((s, p) => (s && s[p] !== undefined) ? s[p] : undefined, obj);
}

async function main() {
  await fs.ensureDir(path.dirname(outCss));
  const tokensExists = await fs.pathExists(tokensPath);
  if (!tokensExists) {
    console.error('Tokens file not found at', tokensPath);
    process.exit(1);
  }
  const tokens = await fs.readJSON(tokensPath);
  const mapping = await fs.readJSON(mappingPath);
  const theme = {};
  let css = ':root {\n';
  for (const [byqKey, ourPath] of Object.entries(mapping)) {
    const value = get(tokens, ourPath);
    if (value === undefined) {
      console.warn(`Missing token at path ${ourPath} for ${byqKey}`);
      continue;
    }
    const varName = `--byq-${byqKey.replace(/\./g, '-')}`;
    css += `  ${varName}: ${value};\n`;
    theme[byqKey] = value;
  }
  css += '}\n';
  await fs.writeFile(outCss, css, 'utf8');
  await fs.writeJSON(outJson, theme, { spaces: 2 });
  console.log('Generated theme:', outCss, outJson);
}

main().catch(err => { console.error(err); process.exit(1); });
