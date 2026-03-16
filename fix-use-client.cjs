const fs = require('fs');
const path = require('path');
function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('"use client"') || content.includes("'use client'")) {
                let lines = content.split('\n');
                const useClientIndex = lines.findIndex(l => l.trim() === '"use client";' || l.trim() === "'use client';" || l.trim() === '"use client"' || l.trim() === "'use client'");
                if (useClientIndex > 0) {
                    console.log('Fixing ' + fullPath);
                    lines.splice(useClientIndex, 1);
                    lines.unshift('"use client";');
                    fs.writeFileSync(fullPath, lines.join('\n'));
                }
            }
        }
    }
}
['components', 'app', 'pages', 'contexts', 'hooks'].forEach(processDir);
