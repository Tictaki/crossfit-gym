import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, 'src', 'app', 'api');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('route.js')) results.push(file);
        }
    });
    return results;
}

const files = walk(apiDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Ensure force-dynamic and revalidate at top
    if (!content.includes("export const dynamic = 'force-dynamic';")) {
        content = "export const dynamic = 'force-dynamic';\n" + content;
        changed = true;
    }
    if (!content.includes("export const revalidate = 0;")) {
        // Find line after dynamic and insert revalidate
        content = content.replace("export const dynamic = 'force-dynamic';", "export const dynamic = 'force-dynamic';\nexport const revalidate = 0;");
        changed = true;
    }

    // 2. Change new URL(request.url) to request.nextUrl
    if (content.includes('new URL(request.url)')) {
        content = content.replace(/new URL\(request\.url\)/g, 'request.nextUrl');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
    }
});
