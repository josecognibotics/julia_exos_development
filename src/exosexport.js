const fs = require('fs');
const path = require('path');

class ExosExport {

    /**
     * @type {string}
     */
    _exosPkgFileName;

	/**
	 * @type {string}
	 */
	_packagePath;

	/**
	 * @type {string}
	 */
	_apjPath;

    /**
     * Create an export object and make sure its an exOS package
     * 
     * @param packagePath path of the exOS package to be exported
     */
    constructor(packagePath) {
    
		function searchASroot(inBranch) {
			let currPath = inBranch;
		
			try {
				currPath = path.dirname(currPath)
		
				while (currPath != path.dirname(currPath)) {
					console.log(currPath);
					let contents = fs.readdirSync(currPath);
		
					let apjFound = false;
					let binariesFound = false;
					let logicalFound = false;
					let physicalFound = false;
					let tempFound = false;
					let apjFile = ""
		
					for (let item of contents) {
						if (item.includes(".apj")) {
							let stats = fs.statSync(path.join(currPath, item));
							//is it a file?
							if (stats.isFile()) {
								apjFound = true;
								apjFile = item;
							}
						}
						else if (item === "Logical") {
							let stats = fs.statSync(path.join(currPath, item));
							//is it a directory?
							if (!stats.isFile()) { logicalFound = true; }
						}
						else if (item === "Physical") {
							let stats = fs.statSync(path.join(currPath, item));
							//is it a directory?
							if (!stats.isFile()) { physicalFound = true; }
						}
						else if (item === "Binaries") {
							let stats = fs.statSync(path.join(currPath, item));
							//is it a directory?
							if (!stats.isFile()) { binariesFound = true; }
						}
						else if (item === "Temp") {
							let stats = fs.statSync(path.join(currPath, item));
							//is it a directory?
							if (!stats.isFile()) { tempFound = true; }
						}
					}
		
					currPath = path.dirname(currPath)
				}
				
				if (apjFound && binariesFound && logicalFound && physicalFound && tempFound) {
					return path.join(currPath, apjFile);
				}
				else {
					throw ("Can't find project root directory or project is not built")	
				}

			} catch (e) {
				throw ("Can't find project root directory or project is not built")
			}
		}

		let files = fs.readdirSync(packagePath);
		for(let file of files) {
			if(file.endsWith(".exospkg"))
			{
				let stats = fs.statSync(path.join(packagePath, file));
				//is it a file?
				if (stats.isFile()) {
					this._exosPkgFileName = path.join(packagePath, file);
					break;
				}
			}
		};
		
		if(!this._exosPkgFileName) 
		{
			throw(`Export: Folder is not an exOS package: ${packagePath}`);
		}

		this._apjPath = searchASroot(packagePath);

		this._packagePath = packagePath;
    }

	/**
	 * get a list of available configurations to select from
	 */
	getConfigurations() {
		return [];
	}


}

if (require.main === module) {
    
    if (process.argv.length > 1) {
        let folderName = process.argv[2];
        let exosExport = new ExosExport(path.join(__dirname,folderName));
    }
    else {
        process.stderr.write("usage: ./exospkg.js <filename>\n");
    }
}

module.exports = {ExosExport};