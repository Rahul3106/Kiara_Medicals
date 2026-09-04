import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientSrcPath = path.join(__dirname, '../../client/src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(clientSrcPath);

// Define exactly what word-boundaries to replace.
const replacements = [
  { regex: /\btext-\[10px\]\b/g, replacement: 'text-xs' },
  { regex: /\btext-\[11px\]\b/g, replacement: 'text-sm' },
  { regex: /\btext-xs\b/g, replacement: 'text-sm' },
  { regex: /\btext-sm\b/g, replacement: 'text-base' },
  { regex: /\btext-base\b/g, replacement: 'text-lg' },
  { regex: /\btext-lg\b/g, replacement: 'text-xl' },
  { regex: /\btext-xl\b/g, replacement: 'text-2xl' },
  
  // Padding & Sizing
  { regex: /\bpy-0\.5\b/g, replacement: 'py-1' },
  { regex: /\bpy-1\b/g, replacement: 'py-1.5' },
  { regex: /\bpy-1\.5\b/g, replacement: 'py-2' },
  { regex: /\bpy-2\b/g, replacement: 'py-2.5' },
  { regex: /\bpy-2\.5\b/g, replacement: 'py-3' },
  { regex: /\bpy-3\b/g, replacement: 'py-4' },
  
  { regex: /\bpx-1\.5\b/g, replacement: 'px-2' },
  { regex: /\bpx-2\b/g, replacement: 'px-3' },
  { regex: /\bpx-2\.5\b/g, replacement: 'px-3.5' },
  { regex: /\bpx-3\b/g, replacement: 'px-4' },
  { regex: /\bpx-3\.5\b/g, replacement: 'px-5' },
  
  { regex: /\bp-3\b/g, replacement: 'p-4' },
  { regex: /\bp-4\b/g, replacement: 'p-5' },
  { regex: /\bp-5\b/g, replacement: 'p-6' },

  // Gaps
  { regex: /\bgap-1\b/g, replacement: 'gap-2' },
  { regex: /\bgap-1\.5\b/g, replacement: 'gap-2' },
  { regex: /\bgap-2\b/g, replacement: 'gap-3' },
  { regex: /\bgap-3\b/g, replacement: 'gap-4' },

  // Max width (make it use way more screen)
  { regex: /\bmax-w-7xl\b/g, replacement: 'max-w-[96%]' },
  
  // Icons sizing (lucide-react size={...})
  { regex: /size=\{11\}/g, replacement: 'size={14}' },
  { regex: /size=\{12\}/g, replacement: 'size={16}' },
  { regex: /size=\{13\}/g, replacement: 'size={18}' },
  { regex: /size=\{14\}/g, replacement: 'size={18}' },
  { regex: /size=\{15\}/g, replacement: 'size={20}' },
  { regex: /size=\{16\}/g, replacement: 'size={20}' }
];

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let newContent = content;

  // We need to apply replacements carefully so we don't double replace.
  // Using a token-based replacement is safer.
  
  // Actually, since JS replace sequentially evaluates, doing it naively WILL cause double replacements
  // e.g. text-xs -> text-sm, then text-sm -> text-base.
  // Let's tokenize instead.
  
  const tokens = [
    'text-[10px]', 'text-[11px]', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl',
    'py-0.5', 'py-1', 'py-1.5', 'py-2', 'py-2.5', 'py-3',
    'px-1.5', 'px-2', 'px-2.5', 'px-3', 'px-3.5',
    'p-3', 'p-4', 'p-5',
    'gap-1', 'gap-1.5', 'gap-2', 'gap-3',
    'max-w-7xl'
  ];
  
  const tokenMap = {
    'text-[10px]': 'text-xs',
    'text-[11px]': 'text-sm',
    'text-xs': 'text-sm',
    'text-sm': 'text-base',
    'text-base': 'text-lg',
    'text-lg': 'text-xl',
    'text-xl': 'text-2xl',
    'py-0.5': 'py-1',
    'py-1': 'py-1.5',
    'py-1.5': 'py-2.5',
    'py-2': 'py-3',
    'py-2.5': 'py-3.5',
    'py-3': 'py-4',
    'px-1.5': 'px-2',
    'px-2': 'px-3',
    'px-2.5': 'px-3.5',
    'px-3': 'px-4',
    'px-3.5': 'px-5',
    'p-3': 'p-4',
    'p-4': 'p-5',
    'p-5': 'p-6',
    'gap-1': 'gap-2',
    'gap-1.5': 'gap-2',
    'gap-2': 'gap-3',
    'gap-3': 'gap-4',
    'max-w-7xl': 'max-w-[96%]'
  };

  // Replace text tokens securely by splitting words
  // A regex that matches any of the tokens bounded by word boundaries
  // Note: [ and ] are not word characters, so \b fails on text-[10px]
  
  // Custom replacer
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Build a single regex for all tokens
  const tokenRegex = new RegExp('(?<![a-zA-Z0-9-])(' + tokens.map(escapeRegExp).join('|') + ')(?![a-zA-Z0-9-])', 'g');
  
  newContent = newContent.replace(tokenRegex, (match) => {
    return tokenMap[match] || match;
  });
  
  // Now handle icon sizes specifically
  const iconSizeMap = {
    '11': '14',
    '12': '16',
    '13': '18',
    '14': '18',
    '15': '20',
    '16': '20'
  };
  
  newContent = newContent.replace(/size=\{([0-9]+)\}/g, (match, p1) => {
    if (iconSizeMap[p1]) return `size={${iconSizeMap[p1]}}`;
    return match;
  });

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf-8');
    changedFiles++;
  }
});

console.log(`Updated UI sizing on ${changedFiles} frontend files.`);
