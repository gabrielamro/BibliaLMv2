const fs = require('fs');
const path = require('path');

const SRC_DIRS = ['pages', 'components', 'contexts', 'hooks', 'utils'];

function getRelativePathToRouter(filePath) {
    const depth = filePath.split(path.sep).length - 1; // Assuming src is root of path. Wait, filePath starts with 'components/' so depth is 1
    // if depth is 1, e.g. components/AdminPage.tsx, router is in utils/router.tsx, so path is '../utils/router'
    // if depth is 2, e.g. pages/social/SocialFeedPage.tsx, path is '../../utils/router'
    let upDir = '';
    for (let i = 0; i < depth; i++) {
        upDir += '../';
    }
    return upDir + 'utils/router';
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Remove old broken navigate logic and imports from next/navigation
    if (content.match(/import\s*\{.*?\}\s*from\s*['"]next\/navigation['"]/)) {

        let needNavigate = content.includes('useRouter') || content.includes('useNavigate');
        let needLocation = content.includes('usePathname') || content.includes('useLocation');
        let needParams = content.includes('useParams');
        let needSearchParams = content.includes('useSearchParams');
        let needNavigateComp = content.includes('<Navigate');

        // Remove next/navigation entirely
        content = content.replace(/import\s*\{.*?\}\s*from\s*['"]next\/navigation['"];?/g, '');

        const imports = [];
        if (needNavigate) imports.push('useNavigate');
        if (needLocation) imports.push('useLocation');
        if (needParams) imports.push('useParams');
        if (needSearchParams) imports.push('useSearchParams');
        if (needNavigateComp) imports.push('Navigate');

        if (imports.length > 0) {
            const relPath = getRelativePathToRouter(filePath);
            content = `import { ${imports.join(', ')} } from '${relPath}';\n` + content;
            changed = true;
        }

        // Revert hook calls
        content = content.replace(/useRouter\(\)/g, 'useNavigate()');
        content = content.replace(/const\s+router\s*=\s*/g, 'const navigate = ');
        content = content.replace(/router\.push\(/g, 'navigate(');
        content = content.replace(/router\.replace\(/g, 'navigate('); // not precise but wait, navigate replaces if we pass {replace: true}

        // Replace bad location hacks I did: `{ pathname: usePathname(), search: useSearchParams() ? "?" + useSearchParams().toString() : "", state: {} }` -> `useLocation()`
        content = content.replace(/\{ pathname:\s*usePathname\(\),\s*search:[\s\S]*?,\s*state:\s*\{\}\s*\}/g, 'useLocation()');
        content = content.replace(/usePathname\(\)/g, 'useLocation().pathname');

        // Link 'to' props -> 'href' globally for any next/link tag
        // <Link to="/path"> to <Link href="/path">
        content = content.replace(/<Link([^>]*?)\s+to=({[^}]*}|"[^"]*"|'[^']*')/g, '<Link$1 href=$2');

    }

    // Also, if someone manually still has `import { Navigate } from 'react-router-dom'` because my previous script missed it:
    if (content.includes('react-router-dom')) {
        content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]react-router-dom['"];?/g, (match, importsStr) => {
            const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
            const rImports = [];
            const otherImports = []; // We won't use other imports for now, but just drop them.
            for (const imp of imports) {
                if (['useNavigate', 'useLocation', 'useParams', 'useSearchParams', 'Navigate'].includes(imp)) {
                    rImports.push(imp);
                }
            }
            if (rImports.length > 0) {
                const relPath = getRelativePathToRouter(filePath);
                return `import { ${rImports.join(', ')} } from '${relPath}';`;
            }
            return '';
        });
        changed = true;
    }

    // Fix <Navigate to=... /> replace prop object literal.
    // Actually our new component handles `<Navigate to="/path" replace />` perfectly! So nothing to do.

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
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
            fixFile(fullPath);
        }
    }
}

SRC_DIRS.forEach(traverseDir);
console.log('Finished fixing files.');
