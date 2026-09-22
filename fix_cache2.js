const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('/home/jkiddo/tesis-mesh/tesis-frontend/src/app', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Remove the dynamic export
        if (content.includes("export const dynamic = 'force-dynamic';\n")) {
            content = content.replace("export const dynamic = 'force-dynamic';\n", "");
            modified = true;
        }

        // Inject cache: 'no-store' into fetch calls
        // Regex to find fetch(..., { ... }) and insert cache: 'no-store'
        if (content.includes("fetch(") && content.includes(", {")) {
            // We previously injected headers: { 'ngrok-skip-browser-warning': 'true', ...
            // Let's just blindly inject cache: 'no-store', right after the '{' of the options object.
            if (!content.includes("cache: 'no-store'")) {
                content = content.replace(/fetch\(([^,]+),\s*\{/g, "fetch($1, { cache: 'no-store',");
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed cache issue in:', filePath);
        }
    }
});
