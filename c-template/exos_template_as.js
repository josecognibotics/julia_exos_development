const path = require('path');
const fs = require('fs');

function replaceTypWithPackage(fsPath, package) {

    //update the Package file if were in an AS project
    let pkgFileName = `${path.dirname(fsPath)}/Package.pkg`;
    pkgFileName = path.normalize(pkgFileName);
    
    if (fs.existsSync(pkgFileName)) {
        let lines = fs.readFileSync(pkgFileName).toString();
        packageHasTypFile = false;
        lines = lines.split("\r").join("");
        lines = lines.split("\n");
        let out = "";
        for(let line of lines) 
        {
            if(line.includes(path.basename(fsPath)) && line.includes("Object") && line.includes("File")) {
                out += `    <Object Type="Package">${package}</Object>\r\n`;
                packageHasTypFile = true;
            }
            else {
                out += `${line}\r\n`;
            }
        }

        if(packageHasTypFile)
        {
            fs.writeFileSync(pkgFileName,out);
            fs.unlinkSync(fsPath);
        }
        else
            throw(fsPath);

        return true;
    }   
    else {
        throw(pkgFileName);
        return false;
    }
}

module.exports = {
    replaceTypWithPackage
}