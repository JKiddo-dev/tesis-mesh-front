const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('/home/jkiddo/tesis-mesh/tesis-frontend/src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix socket.io calls
        if (content.includes("io(process.env.NEXT_PUBLIC_API_URL || '')")) {
            content = content.replace(/io\(process\.env\.NEXT_PUBLIC_API_URL \|\| ''\)/g, "io(process.env.NEXT_PUBLIC_API_URL || '', { extraHeaders: { 'ngrok-skip-browser-warning': 'true' } })");
            modified = true;
        }
        else if (content.includes("io(`${process.env.NEXT_PUBLIC_API_URL}`)")) {
            content = content.replace(/io\(`\$\{process\.env\.NEXT_PUBLIC_API_URL\}`\)/g, "io(`${process.env.NEXT_PUBLIC_API_URL}`, { extraHeaders: { 'ngrok-skip-browser-warning': 'true' } })");
            modified = true;
        }

        // Add ngrok header to all headers blocks
        // Regex: /headers:\s*\{/g -> "headers: { 'ngrok-skip-browser-warning': 'true',"
        if (content.includes("headers: {") && !content.includes("ngrok-skip-browser-warning")) {
            content = content.replace(/headers:\s*\{/g, "headers: { 'ngrok-skip-browser-warning': 'true',");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed ngrok headers:', filePath);
        }
    }
});
