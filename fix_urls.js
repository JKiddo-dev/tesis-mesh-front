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

        if (content.includes("io('http://localhost:4000')")) {
            content = content.replace(/io\('http:\/\/localhost:4000'\)/g, "io(process.env.NEXT_PUBLIC_API_URL || '')");
            modified = true;
        }

        if (content.includes("'http://localhost:4000")) {
            content = content.replace(/'http:\/\/localhost:4000([^']*)'/g, "`\${process.env.NEXT_PUBLIC_API_URL}$1`");
            modified = true;
        }
        
        if (content.includes("`http://localhost:4000")) {
            content = content.replace(/`http:\/\/localhost:4000([^`]*)`/g, "`\${process.env.NEXT_PUBLIC_API_URL}$1`");
            modified = true;
        }

        if (content.includes('"http://localhost:4000"')) {
            content = content.replace(/"http:\/\/localhost:4000"/g, 'process.env.NEXT_PUBLIC_API_URL || ""');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', filePath);
        }
    }
});
