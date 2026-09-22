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

        // More robust: split by "headers: {" and check each block
        let parts = content.split(/headers:\s*\{/);
        if (parts.length > 1) {
            let newContent = parts[0];
            for (let i = 1; i < parts.length; i++) {
                // Check if this specific block already has it
                // We just look at the next 100 characters to see if it was added
                let nextChars = parts[i].substring(0, 100);
                if (!nextChars.includes('ngrok-skip-browser-warning')) {
                    newContent += "headers: { 'ngrok-skip-browser-warning': 'true', " + parts[i];
                    modified = true;
                } else {
                    newContent += "headers: {" + parts[i];
                }
            }
            content = newContent;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed headers in:', filePath);
        }
    }
});
