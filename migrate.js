import fs from 'fs';
import path from 'path';

const SRC_DIRS = ['pages', 'components', 'contexts', 'hooks', 'utils'];
const APP_DIR = 'app';

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // React Router DOM -> Next Navigation
    if (content.includes('react-router-dom')) {
        content = content.replace(/import\s*\{(.*?)\}\s*from\s*['"]react-router-dom['"];?/g, (match, imports) => {
            let nextNavImports = [];
            let nextLinkImports = [];

            if (imports.includes('useNavigate')) nextNavImports.push('useRouter');
            if (imports.includes('useLocation')) nextNavImports.push('usePathname');
            if (imports.includes('useParams')) nextNavImports.push('useParams');
            if (imports.includes('useSearchParams')) nextNavImports.push('useSearchParams');
            if (imports.includes('Link')) nextLinkImports.push('import Link from "next/link";');

            let replacements = [];
            if (nextNavImports.length > 0) {
                replacements.push(`import { ${nextNavImports.join(', ')} } from 'next/navigation';`);
            }
            if (nextLinkImports.length > 0) {
                replacements.push(nextLinkImports.join('\n'));
            }

            return replacements.join('\n');
        });

        // Replace useNavigate() hooks
        content = content.replace(/useNavigate\(\)/g, 'useRouter()');
        content = content.replace(/const\s+navigate\s*=\s*useRouter/g, 'const router = useRouter');
        content = content.replace(/navigate\(/g, 'router.push(');

        // Replace useLocation() hooks 
        content = content.replace(/useLocation\(\)/g, '{ pathname: usePathname(), search: useSearchParams() ? "?" + useSearchParams().toString() : "", state: {} }');

        // Link components
        content = content.replace(/<Link\s+to=/g, '<Link href=');

        changed = true;
    }

    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        if (!content.includes('"use client"') && !content.includes("'use client'")) {
            const hasReactHooks = content.match(/use(State|Effect|Context|Ref|Memo|Callback|Router|Pathname|Params|SearchParams)/);
            if (hasReactHooks) {
                content = `"use client";\n\n` + content;
                changed = true;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Refactored:', filePath);
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
            refactorFile(fullPath);
        }
    }
}

// 1. Traverse and refactor imports
SRC_DIRS.forEach(traverseDir);
console.log('Finished refactoring imports.');
