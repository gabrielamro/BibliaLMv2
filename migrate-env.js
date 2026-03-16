import fs from 'fs';
import path from 'path';

const SRC_DIRS = ['pages', 'components', 'contexts', 'hooks', 'utils', 'services'];

function refactorEnv(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Vite env variables -> Next.js env variables
    if (content.includes('import.meta.env.VITE_')) {
        content = content.replace(/import\.meta\.env\.VITE_([A-Za-z0-9_]+)/g, 'process.env.NEXT_PUBLIC_$1');
        changed = true;
    }

    // Fallbacks if process.env checking was used
    if (content.includes('process.env.VITE_')) {
        content = content.replace(/process\.env\.VITE_([A-Za-z0-9_]+)/g, 'process.env.NEXT_PUBLIC_$1');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Refactored env in:', filePath);
    }
}

function traverseDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            refactorEnv(fullPath);
        }
    }
}

SRC_DIRS.forEach(traverseDir);
console.log('Finished refactoring environment variables.');
