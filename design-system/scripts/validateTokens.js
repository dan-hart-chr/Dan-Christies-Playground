const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..');
const tokensPath = path.join(base, 'tokens.json');
const atomsPath = path.join(base, 'atoms.tokens.json');
const outReport = path.join(base, 'token-mismatch-report.json');

function safeRead(p){
  if(!fs.existsSync(p)) return null;
  try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ console.error('Failed to parse',p,e); return null; }
}

const tokens = safeRead(tokensPath);
const atoms = safeRead(atomsPath);
const mappingPath = path.join(base, 'token-mapping.json');
const mapping = safeRead(mappingPath) || {};

const report = { missing: {}, details: {} };

if(!tokens) {
  console.warn('::warning::tokens.json not found at', tokensPath);
  fs.writeFileSync(outReport, JSON.stringify({ error: 'tokens.json missing' }, null, 2));
  process.exit(0);
}
if(!atoms) {
  console.warn('::warning::atoms.tokens.json not found at', atomsPath);
  fs.writeFileSync(outReport, JSON.stringify({ error: 'atoms.tokens.json missing' }, null, 2));
  process.exit(0);
}

// Find the atoms root (flexible key name)
const atomsRoot = Object.values(atoms).find(v => v && v.variables) || atoms;

function keysOf(obj){ return obj && typeof obj === 'object' ? Object.keys(obj) : []; }

// Colours
const tokenColors = keysOf(tokens.colors);
const atomsColoursObj = atomsRoot && atomsRoot.variables && (atomsRoot.variables.colour || atomsRoot.variables.color);
const rawAtomsColors = keysOf(atomsColoursObj);
const atomsColors = applyMapping(rawAtomsColors, 'colour', mapping);

// Typography sizes
const tokenTypeSizes = keysOf((tokens.typography && tokens.typography.fontSizes) || {});
const atomsTypeObj = atomsRoot && atomsRoot.variables && atomsRoot.variables.font && atomsRoot.variables.font.size;
const rawAtomsTypeSizes = keysOf(atomsTypeObj);
const atomsTypeSizes = applyMapping(rawAtomsTypeSizes, 'font.size', mapping);

// Spacing
const tokenSpacing = keysOf(tokens.spacing || {});
const atomsSpacingObj = atomsRoot && atomsRoot.variables && atomsRoot.variables.spacing;
const rawAtomsSpacing = keysOf(atomsSpacingObj);
const atomsSpacing = applyMapping(rawAtomsSpacing, 'spacing', mapping);

// Radius
const tokenRadius = keysOf(tokens.radius || {});
const atomsRadiusObj = atomsRoot && atomsRoot.variables && atomsRoot.variables.radius;
const rawAtomsRadius = keysOf(atomsRadiusObj);
const atomsRadius = applyMapping(rawAtomsRadius, 'radius', mapping);

function diff(a,b){ return a.filter(k => !b.includes(k)); }

function applyMapping(keys, family, mapping){
  if(!mapping) return keys;
  const base = mapping[family] || {};
  const supplemental = mapping[`${family}_supplemental`] || {};
  const mapForFamily = Object.assign({}, base, supplemental);
  return keys.map(k => mapForFamily[k] || k);
}

const missing = {
  colors: { inAtomsNotTokens: diff(atomsColors, tokenColors), inTokensNotAtoms: diff(tokenColors, atomsColors) },
  typography: { inAtomsNotTokens: diff(atomsTypeSizes, tokenTypeSizes), inTokensNotAtoms: diff(tokenTypeSizes, atomsTypeSizes) },
  spacing: { inAtomsNotTokens: diff(atomsSpacing, tokenSpacing), inTokensNotAtoms: diff(tokenSpacing, atomsSpacing) },
  radius: { inAtomsNotTokens: diff(atomsRadius, tokenRadius), inTokensNotAtoms: diff(tokenRadius, atomsRadius) }
};

report.missing = missing;
report.details = {
  tokenColors, atomsColors,
  tokenTypeSizes, atomsTypeSizes,
  tokenSpacing, atomsSpacing,
  tokenRadius, atomsRadius
};

let anyMissing = false;
Object.entries(missing).forEach(([family, obj]) => {
  if(obj.inAtomsNotTokens.length || obj.inTokensNotAtoms.length) anyMissing = true;
});

if(anyMissing){
  console.log('Token key differences found across families:');
  Object.entries(missing).forEach(([family, obj]) => {
    if(obj.inAtomsNotTokens.length) {
      console.log(`Present in atoms (${family}) but missing in tokens.json:`, obj.inAtomsNotTokens.join(', '));
      obj.inAtomsNotTokens.forEach(k => console.log(`::warning::atoms contains "${k}" in ${family} but tokens.json does not`));
    }
    if(obj.inTokensNotAtoms.length) {
      console.log(`Present in tokens.json (${family}) but missing in atoms:`, obj.inTokensNotAtoms.join(', '));
      obj.inTokensNotAtoms.forEach(k => console.log(`::warning::tokens.json contains "${k}" in ${family} but atoms.tokens.json does not`));
    }
  });
} else {
  console.log('Token keys match between tokens.json and atoms.tokens.json for colours, typography, spacing and radius');
}

fs.writeFileSync(outReport, JSON.stringify(report, null, 2));
console.log('Mismatch report written to', outReport);
process.exit(0);
