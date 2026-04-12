const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else if (file.endsWith('.css') || file.endsWith('.js')) {
            filelist.push(filepath);
        }
    });
    return filelist;
};

const srcDir = path.join(__dirname, 'src');
const files = walkSync(srcDir);

let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const orig = content;
    
    // Replace CSS variables
    content = content.replace(/var\(--accent\)/g, 'var(--primary)');
    content = content.replace(/var\(--accent-soft\)/g, 'var(--primary-soft)');
    content = content.replace(/var\(--accent-light\)/g, 'var(--primary-soft)');
    content = content.replace(/var\(--accent-secondary\)/g, 'var(--primary)');
    
    // Explicit color `#06B6D4` (teal) to primary
    if (file.endsWith('.js') || file.endsWith('.css')) {
        content = content.replace(/#06B6D4/gi, 'var(--primary)');
    }
    
    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log('Updated:', file);
    }
});

console.log(`Replaced in ${changed} files.`);
