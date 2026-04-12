const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src/pages/SettingsPage.css');
let content = fs.readFileSync(cssPath, 'utf8');

const replacements = [
    { target: /background:\s*#020617;/g, replacement: "background: #F8FAFC;" },
    { target: /color:\s*#fff;/g, replacement: "color: #0F172A;" },
    { target: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.6\);/g, replacement: "color: #475569;" },
    { target: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.5\);/g, replacement: "color: #64748B;" },
    { target: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.4\);/g, replacement: "color: #94A3B8;" },
    { target: /color:\s*rgba\(255,\s*255,\s*255,\s*0\.3\);/g, replacement: "color: #94A3B8;" },
    { target: /background:\s*#050A1F;/g, replacement: "background: #ffffff;" },
    { target: /border(?:-right|-top|-bottom)?:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.05\);/g, replacement: (match) => match.replace("rgba(255, 255, 255, 0.05)", "#E2E8F0") },
    { target: /border(?:-right|-top|-bottom)?:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.08\);/g, replacement: (match) => match.replace("rgba(255, 255, 255, 0.08)", "#E2E8F0") },
    { target: /border(?:-right|-top|-bottom)?:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.1\);/g, replacement: (match) => match.replace("rgba(255, 255, 255, 0.1)", "#CBD5E1") },
    { target: /border:\s*2px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.1\);/g, replacement: "border: 2px solid #E2E8F0;" },
    { target: /border:\s*1px\s*dashed\s*rgba\(255,\s*255,\s*255,\s*0\.1\);/g, replacement: "border: 1px dashed #CBD5E1;" },
    { target: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\);/g, replacement: "background: #F1F5F9;" },
    { target: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.04\);/g, replacement: "background: #F8FAFC;" },
    { target: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\);/g, replacement: "background: #ffffff;" },
    { target: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\);/g, replacement: "background: #ffffff;" },
    { target: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.06\);/g, replacement: "background: #ffffff;" },
    { target: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.08\);/g, replacement: "background: #F1F5F9;" },
    { target: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\);/g, replacement: "background: #E2E8F0;" },
    { target: /border:\s*3px\s*solid\s*#020617;/g, replacement: "border: 3px solid #F8FAFC;" },
    { target: /border-top-color:\s*#fff;/g, replacement: "border-top-color: #0F172A;" },
    { target: /border(?:-bottom)?:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.1\);?/g, replacement: (match) => match.replace("rgba(255, 255, 255, 0.1)", "#CBD5E1") },
    { target: /background:\s*#1E293B;/g, replacement: "background: #ffffff;" },
];

replacements.forEach(({ target, replacement }) => {
    content = content.replace(target, replacement);
});

// A few custom fixes for buttons where color is explicitly white but the background is a solid color
content = content.replace(/\.save-btn \{\s*background:\s*var\(--primary\);\s*color:\s*#0F172A;/g, ".save-btn {\n    background: var(--primary);\n    color: #fff;");
content = content.replace(/\.avatar-edit-overlay \{\s*[\s\S]*?color:\s*#0F172A;/g, (match) => match.replace("color: #0F172A", "color: #fff"));

// Active save button loader should have primary color spinner or dark spinner
content = content.replace(/border(?:.+)?:\s*2px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.3\);/g, "border: 2px solid rgba(255, 255, 255, 0.5);");

fs.writeFileSync(cssPath, content, 'utf8');
console.log("Settings theme updated to light.");
