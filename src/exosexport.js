const fs = require('fs');
const path = require('path');
const parser = require('xml-parser');
const { ExosPkg, EXOSPKG_VERSION } = require('./exospkg');
const { Package, PackageObject, FileObj } = require('./exospackage');
const { versions } = require('process');

function removeASXML(packageXML) {
	return packageXML.replace(/<\?AutomationStudio\/?[^>]+(\?>|$)/g,""); //the xml-parser doesnt like this entry
}

class ExportPackage extends Package {

	/**
	 * absolute path to the package
	 * @type {string}
	 */
	_packagePath;

	/**
	 * version of the package (if found) - if no version is found, its undefined
	 * @type {string}
	 */
	_version;

    /**
     * Create an export object and make sure its an exOS package
     * 
     * @param {string} packagePath path of the exOS package to be exported
	 * @param {string} type type of package: `Package` | `Library` | `Program`. throws an exeption if package type doesnt match
	 * @param {string} subType expected package SubType: `ANSIC` | `IEC` | `exosPackage` | `exosLinuxPackage` . throws an exeption is the subtype found doesnt match
	 * @param {string} packageFileName name of the xml packagefile used within this package, like `Package.pkg` or `ANSIC.lby`
	 * @param {string[]} [extensions] (optional) list of file extensions that we ant to include, like `.var` `.typ` - can be used inversed, like `!.deb`, `!.bin` and so on. if left out, all files will be included
	 * @param {ExosPkgExport} [exosPkg] (optional) exos package that is provided to the `LinuxExport` package 
	 * 
	 * @returns {string} version of the package (if provided) - if no version is provided, an empty string is returned
     */
    constructor(packagePath, type, subType, packageFileName, extensions, exosPkg) {

		super(path.basename(packagePath), packageFileName);
		this._packagePath = packagePath;

		if(!extensions || !Array.isArray(extensions)) {
			extensions = [""];
		}

		if(!fs.existsSync(path.join(packagePath,packageFileName))) {
			throw(`Package file not found: ${path.join(packagePath,packageFileName)}`);
		}

		let packageXML = fs.readFileSync(path.join(packagePath,packageFileName)).toString();
		packageXML = removeASXML(packageXML);
		let packageJSON = parser(packageXML);

		if(!packageJSON.root || !packageJSON.root.attributes) {
			throw(`cannot parse ${packageFileName}`);
		}

		if(packageJSON.root.name != type) {
			throw(`${this._folderName}: Type: ${packageJSON.root.name} does not match expected: ${type}`);
		}

		if(packageJSON.root.attributes.SubType != subType) {
			throw(`${this._folderName}: SubType: ${packageJSON.root.attributes.SubType} does not match expected: ${subType}`);
		}

		if(packageJSON.root.attributes.Version) {
			this._version = packageJSON.root.attributes.Version;
		}

		for(let child of packageJSON.root.children) {
			if(child.name == "Files" && child.children) {
				for(let file of child.children) {
					if(file.name == "File" && file.content) {
						let description = ""
						if(file.attributes.description) {
							description = file.attributes.description;
						}
						let foundExt = false;
						for(let extension of extensions) {
							if(file.content.endsWith(extension)) {
								foundExt = true;
								break;
							}
						}
						if(foundExt) {
							this.addExportFile(file.content, description);
						}
					}
				}
			}
			else if(child.name == "Objects" && child.children) {
				for(let item of child.children) {
					if(item.name == "Object" && item.content && item.attributes) {
						let description = ""
						if(item.attributes.Description) {
							description = item.attributes.Description;
						}

						if(item.attributes.Type == "File") {	
							let foundExt = false;
							for(let extension of extensions) {
								if(extension.startsWith("!")) {
									if(item.content.endsWith(extension.substr(1))) {
										break;
									}
								}
								else if(item.content.endsWith(extension)) {
									foundExt = true;
									break;
								}
							}
							if(foundExt) {
								this.addExportFile(item.content, description);
							}
						}
						else if (item.attributes.Type == "Library") {
							this._objects.push({type:"Library", name:item.content, description:description, attributes:"Language=\"binary\"", _object:new CLibraryExport(path.join(packagePath,item.content), description)});
						}
						else if (item.attributes.Type == "Program") {
							this._objects.push({type:"Program", name:item.content, description:description, attributes:"Language=\"IEC\"", _object:new IECProgramExport(path.join(packagePath,item.content))});
						}
						else if (item.attributes.Type == "Package") {
							this._objects.push({type:"Package", name:item.content, description:description,  attributes:"", _object:new LinuxExport(path.join(packagePath,item.content), exosPkg)});
						}
					}
				}
			}
		}
    }
	
	/**
 	 * @param {string} fileName filename within this package
     * @param {string} [description] (optional) description that will appear in AS
 	 */
	addExportFile(fileName, description) {
		if(description === undefined) {
            description = "";
        }
		if(!fs.existsSync(path.join(this._packagePath,fileName))) {
			throw(`${this._folderName}: export file: ${fileName} doesnt exist!`)
		}
		this._objects.push({type:"File", name:fileName, description:description, contents:fs.readFileSync(path.join(this._packagePath,fileName))})
	}
}

class LinuxExport extends ExportPackage {

	/**
	 * the parsed exos package description file, provided by {@link ExosExport}
	 * @type {ExosPkgExport}
	 */
 	_exosPkg;

	constructor(packagePath, exosPkg) {

		//dont add any files, these are provided later, by the _exosPkg.componentOptions
		super(packagePath, "Package", "exosLinuxPackage", "Package.pkg", ["!"]);
		this._exosPkg = exosPkg;

	}

	exportPackage(destination) {
		if(!this._exosPkg) {
			throw(`${this._folderName}: missing exosPkg!`);
		}

		if(this._exosPkg.componentOptions && this._exosPkg.componentOptions.exportLinux) {
		
			for(let exportFile of this._exosPkg.componentOptions.exportLinux.split(","))
			{
				this.addExportFile(exportFile);
			}
		}

        //fill the package specific contents
        this._pkgFile.contents = this._header;
		this._pkgFile.contents  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._pkgFile.contents  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._pkgFile.contents  += `<Package SubType="exosLinuxPackage" PackageType="exosLinuxPackage" `
		if(this._version) {
			this._pkgFile.contents  += `Version="${this._version}" `
		}
		this._pkgFile.contents  += `xmlns="http://br-automation.co.at/AS/Package">\n`;
        this._pkgFile.contents  += `  <Objects>\n`;

        for (const obj of this._objects) {
            if(obj.description === undefined) {
                obj.description = "";
            }
            //we only write "File" for the objects, because some _objects have special type properties (like "ExistingFile")
            this._pkgFile.contents += `    <Object Type="File" Description="${obj.description}">${obj.name}</Object>\n`;
        }

        this._pkgFile.contents += `  </Objects>\n`;
        this._pkgFile.contents += `</Package>\n`;

        this._createPackage(destination);
    }
}


class IECProgramExport extends ExportPackage {
	constructor(packagePath) {
		//include all files
		super(packagePath,"Program", "IEC", "IEC.prg",[""]);        
	}

	exportPackage(destination) {
        this._pkgFile.contents = "";
		this._pkgFile.contents  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._pkgFile.contents  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._pkgFile.contents  += `<Program SubType="IEC" `
		if(this._version) {
			this._pkgFile.contents  += `Version="${this._version}" `
		}
		this._pkgFile.contents  += `xmlns="http://br-automation.co.at/AS/Program">\n`;
        this._pkgFile.contents  += `  <Files>\n`;
        
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <File Description="${obj.description}">${obj.name}</File>\n`;
        }

		this._pkgFile.contents += `  </Files>\n`;
        this._pkgFile.contents += `</Program>\n`;

        this._createPackage(destination);
    }
}

class CLibraryExport extends ExportPackage {
	
	constructor(packagePath, description) {
		super(packagePath,"Library", "ANSIC", "ANSIC.lby",[".fun",".var",".typ"]);
		this._libraryDescription = description;
	}

	/**
	 * @param {string} destination
	 * @param {ASConfiguration} configuration
	 */
	exportPackage(destination, apjPath, configuration) {

		this._pkgFile.contents = "";
		this._pkgFile.contents  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._pkgFile.contents  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._pkgFile.contents  += `<Library `
		if(this._version) {
			this._pkgFile.contents  += `Version="${this._version}" `
		}
		this._pkgFile.contents  += `SubType="Binary" xmlns="http://br-automation.co.at/AS/Library" Description="${this._libraryDescription}">\n`;
        this._pkgFile.contents  += `  <Files>\n`;

        for (const obj of this._objects) {
            this._pkgFile.contents += `    <File Description="${obj.description}">${obj.name}</File>\n`;
        }
        this._pkgFile.contents += `  </Files>\n`;
        this._pkgFile.contents += `  <Dependencies>\n`;
        this._pkgFile.contents += `    <Dependency ObjectName="ExData" />\n`;
        this._pkgFile.contents += `  </Dependencies>\n`;
        this._pkgFile.contents += `</Library>\n`;

        this._createPackage(destination);

		//create the binaries and h file folder
		let _expPath = path.join(destination, this._folderName, "SG4");
		fs.mkdirSync(_expPath);

		//copy files
		fs.copyFileSync(path.join(apjPath, "Temp", "Includes", `${this._folderName}.h`), path.join(_expPath, `${this._folderName}.h`));
		fs.copyFileSync(path.join(apjPath, "Temp", "Archives", configuration.name, configuration.cpu, `lib${this._folderName}.a`), path.join(_expPath, `lib${this._folderName}.a`));
		fs.copyFileSync(path.join(apjPath, "Binaries", configuration.name, configuration.cpu, `${this._folderName}.br`), path.join(_expPath, `${this._folderName}.br`));
	}
}

class ExosPkgExport extends ExosPkg {

	constructor() {
		super();
	}

	/**
	 * The ExosPkgExport class is expected to be parsed from a file, meaning all
	 * information will be available shortly after creating the class
	 * 
	 * This function returns the .exospkg XML that was parsed, stripped from any build information
	 * 
	 * @example
	 * let exosPkg = new ExosPkgExport();
     * exosPkg.parseFile("MyPackage.exospkg");
	 * console.log(myPackage.exospkg.getExportContents()); //display the output of the "binary" .exospkg file
	 * console.log(myPackage.exospkg.getContents()); //display the full output of the .exospkg file
	 * 
	 * @returns {string} the XML file contents of the "binary" .exospkg file
	 */
	getExportContents()
    {
        let out = ``;

        out += `<?xml version="1.0" encoding="utf-8"?>\n`;
        out += `<ComponentPackage Version="${EXOSPKG_VERSION}" ErrorHandling="${this._errorHandling}" StartupTimeout="${this._startupTimeout}"`
        if(this._restartEvent) {
            out += `RestartEvent="${this._restartEvent}"`;
        }
        out += `>\n`;
        for(const file of this._files) {
            out += `    <File FileName="${file.fileName}"`;
            if(file.changeEvent !== undefined) {
                out += ` ChangeEvent="${file.changeEvent}"`;
            }
            out += `/>\n`;
        }
        for(const service of this._services) {
            out += `    <Service Type="${service.type}" Command="${service.command}"`;
            if(service.workingDirectory !== undefined) {
                out += ` WorkingDirectory="${service.workingDirectory}"`;
            }
            out += `/>\n`;
        }
        for(const datamodel of this._datamodels) {
            out += `    <DatamodelInstance Name="${datamodel.name}"/>\n`;
        }

        out += `</ComponentPackage>\n`;
        return out;
    }
}

/**
 * @typedef {Object} ASConfiguration
 * @property {string} name name of the configuration (like in AS)
 * @property {string} cpu name of the CPU folder, the one subfolder of the configuration
 * @property {string} description description of the configuration (if anyone uses that)
 */
class ExosExport extends ExportPackage {


	/**
	 * @type {ASConfiguration[]}
	 */
	_configurations;

	/**
	 * @type {string}
	 */
	_apjPath;

	/**
	 * @type {string}
	 */
	 _apjFile;

	/**
	 * the parsed exos package description object
	 * @type {ExosPkgExport}
	 */
	_exosPkg;

	/**
	 * the file object that the .exospkg represents within the {@link ExportPackage}
	 * @type {FileObj}
	 */
	_exosPkgFile

	/**
     * Create an export object and make sure its an exOS package
     * 
     * @param packagePath path of the exOS package to be exported
     */
	 constructor(packagePath) {
		
		let exosPkgFileName = undefined;
		let files = fs.readdirSync(packagePath);
		for(let file of files) {
			if(file.endsWith(".exospkg"))
			{
				let stats = fs.statSync(path.join(packagePath, file));
				//is it a file?
				if (stats.isFile()) {
					exosPkgFileName = path.join(packagePath, file);
					break;
				}
			}
		};
		
		if(!exosPkgFileName) 
		{
			throw(`Export: Folder is not an exOS package: ${packagePath}`);
		}

		let exosPkg = new ExosPkgExport();
		exosPkg.parseFile(exosPkgFileName);

		//the .exospkg should be populated from ExosPkgExport.getExportContents(), and not copied from the original file..
		super(packagePath, "Package", "exosPackage", "Package.pkg", ["!.exospkg"], exosPkg);

		this._configurations = [];
		this._exosPkg = exosPkg;
		//..we therefore add the .exospkgfile as a new file instead and populate it in the exportPackage()
		this._exosPkgFile = this.getNewFile(path.basename(exosPkgFileName),"exOS package description");

		this._findASExports();
	}

	_findASExports() {
		function searchASroot(inBranch) {
			let currPath = inBranch;
		
			try {
				currPath = path.dirname(currPath)
				let apjFound = false;
				let binariesFound = false;
				let logicalFound = false;
				let physicalFound = false;
				let tempFound = false;
				let apjFile = ""

				while (currPath != path.dirname(currPath)) {
					let contents = fs.readdirSync(currPath);
		
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
					if (apjFound && binariesFound && logicalFound && physicalFound && tempFound) {
						break;
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

		let apjFile = searchASroot(this._packagePath);
		this._apjPath = path.dirname(apjFile);
		this._apjFile = path.basename(apjFile);

		let physicalPkgName = path.join(this._apjPath, "Physical", "Physical.pkg");
		if(!fs.existsSync(physicalPkgName)) {
			throw(`Can't find Physical package ${physicalPkgName}`);
		}

		let physicalPkgXML = fs.readFileSync(physicalPkgName).toString();
		physicalPkgXML = removeASXML(physicalPkgXML);

		let physicalPkgJSON = parser(physicalPkgXML);

		if(!physicalPkgJSON.root || physicalPkgJSON.root.name != "Physical") {
			throw(`Physical package ${physicalPkgName} is invalid`);
		}

		//the physical package defines its configurations in the <Objects><Object> list
		//get the path of all these configurations, to be used later
		for(let child of physicalPkgJSON.root.children) {
			if(child.name == "Objects" && child.children) {
				for(let item of child.children) {
					if(item.name == "Object" && item.content && item.attributes) {
						let description = ""
						if(item.attributes.Description) {
							description = item.attributes.Description;
						}

						if(item.attributes.Type == "Configuration") {	

							//all paths in the Temp are based on the cpu name as well, therefore take out the name of the cpu folder from the Config.pkg within the 
							let cpuObjName = path.join(path.dirname(physicalPkgName),item.content,"Config.pkg");
							if(!fs.existsSync(cpuObjName)) {
								throw(`Can't find Configuration package ${cpuObjName}`);
							}

							let cpuObjXML = fs.readFileSync(cpuObjName).toString();
							cpuObjXML = removeASXML(cpuObjXML);
							let cpuObjJSON = parser(cpuObjXML);
							if(!cpuObjJSON.root || cpuObjJSON.root.name != "Configuration") {
								throw(`Configuration package ${cpuObjName} is invalid`);
							}

							for(let cpuchild of cpuObjJSON.root.children) {
								if(cpuchild.name == "Objects" && cpuchild.children) {
									for(let cpuitem of cpuchild.children) {
										if(cpuitem.name == "Object" && cpuitem.content && cpuitem.attributes && cpuitem.attributes.Type == "Cpu") {
											//as soon as we have one cpu, we can populate the configurations[] list
											this._configurations.push({name:item.content, cpu:cpuitem.content, description:description});
										}
									}
								}
							}
						}
					}
				}
			}
		}

	}

	/**
	 * get a list of available configurations to select from
	 * 
	 * @returns {ASConfiguration[]}
	 */
	getConfigurations() {
		return this._configurations;
	}

	/**
	 * Export the exosPackage to a destination folder, where the complete package will be created.
	 * You need to specify a configuration as Library files have their 
	 */
	exportPackage(destination, configurationName) {
        
		let useConfiguration = undefined;
		for(let configuration of this._configurations) {
			if(configurationName == configuration.name && configuration.cpu) {
				useConfiguration = configuration;
			}
		}

		if(!useConfiguration) {
			throw(`Configuration ${configurationName} can not be found!`);
		}

        this._pkgFile.contents = "";
		this._pkgFile.contents += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._pkgFile.contents += `<?AutomationStudio FileVersion="4.9"?>\n`;
        this._pkgFile.contents += `<Package SubType="exosPackage" PackageType="exosPackage" `;
		if(this._version) {
			this._pkgFile.contents  += `Version="${this._version}" `
		}
		this._pkgFile.contents += `xmlns="http://br-automation.co.at/AS/Package">\n`;
        this._pkgFile.contents += `  <Objects>\n`;

        for (const obj of this._objects) {
            this._pkgFile.contents += `    <Object Type="${obj.type}" ${obj.attributes} Description="${obj.description}">${obj.name}</Object>\n`;
        }
        this._pkgFile.contents += `  </Objects>\n`;
        this._pkgFile.contents += `</Package>\n`;

        this._exosPkgFile.contents = this._exosPkg.getExportContents();

        this._createPackage(destination);

        for (const obj of this._objects) {
            if(obj.type == "Library" || obj.type == "Program" || obj.type == "Package") {

				if(obj.type == "Library" && useConfiguration) {
					obj._object.exportPackage(path.join(destination,this._folderName), this._apjPath, useConfiguration);
				}
				else {
					obj._object.exportPackage(path.join(destination,this._folderName));
				}
            }
        }
    }
}


if (require.main === module) {
    
    if (process.argv.length > 3) {
        let folderName = process.argv[2];
		let exportFolder = process.argv[3];
        let lib = new ExosExport(path.join(folderName));

		console.log(lib.getConfigurations());

		lib.exportPackage(exportFolder, "PC910_IntegrationTests")
    }
    else {
        process.stderr.write("usage: ./exospkg.js <exos pkg folder> <exportfolder> \n");
    }
}

module.exports = {ExosExport};