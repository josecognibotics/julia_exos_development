/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const { ExosPkg } = require('./exospkg')

const fs = require('fs');
const path = require('path');

/**
 * Base class for Packages, used for inheritance
 * 
 * @typedef {Object} UpdatePackageResults
 * @property {number} filesUpdated number of files updated
 * @property {number} filesNotFound number of files that could not be found
 * @property {number} foldersNotFound number of folders that could not be found
 * 
 * @typedef {Object} PackageObject
 * @property {string} type `File` | `Library` | `Program` | `Package` | `ExistingFile`
 * @property {string} name fileName of the package/file
 * @property {string} description description in AS
 * @property {string} contents contents of the file, only used for `type=File`, written to disk with {@link Package._createPackage},  {@link Package._updatePackage} or {@link Package._exportPackage} 
 * @property {IECProgram|CLibrary|LinuxPackage} _object objet reference to an object created in @{@link ExosPackage}
 * 
 */
class Package {


    /**
     * list of all objects within this package
     * @type {PackageObject[]}
     */
    _objects;

    /**
     * the hidden package file within the pacakge
     * @type {PackageObject}
     */
    _pkgFile;

    /**
     * the packagefile XML header
     * @type {string}
     */
    _header;

    /**
     * the packagefile XML footer
     * @type {string}
     */
    _footer;

    /**
     * 
     * @param {string} folderName Name of the folder in which this package is created, like `MyLibrary` or `Linux`. If not specifiec, the _folderName will be set to an empty string
	 * @param packageFileName name of the xml packagefile used within this package, like `Package.pkg` or `ANSIC.lby`
     * 
     */
    constructor(folderName, packageFileName) {

        if(folderName) {
            this._folderName = folderName;
        }
        else {
            this._folderName = "";
        }
        
        this._objects = [];
        this._pkgFile = {type:"File", name:packageFileName, contents:""};

        this._header = "";
        this._footer = "";
        
    }

    /**
     * @returns {string} name of the package, same as the folder name
     */
    get name() {
        return this._folderName;
    }

    /**
     * Create a new file in this package and populate its contents
     * Use this method if the complete file contents are already available, 
     * otherwise use the {@link getNewFile} which returns a mutable `FileObj` that can be populated with contents
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     * myPackage.addNewFile("myfile.txt", "hello world!\n", "test file");
     * myPackage.makePackage("C:\\Temp");
     * 
     * @param {string} fileName filename within this package
     * @param {string} contents contents of the file that is to be stored on disk e.g. "hello world!\n"
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     * 
     */
    addNewFile(fileName, contents, description, insert) {
        if(description === undefined) {
            description = "";
        }
        if(insert && insert == true) {
            this._objects.unshift({type:"File", name:fileName, attributes:"", description:description, contents:contents});
        }
        else {
            this._objects.push({type:"File", name:fileName, attributes:"", description:description, contents:contents});
        }
    }

    /**
     * Create a new file in this package using a {@link FileObj} object.
     * Same as the {@link addNewFile} whereas the `fileObj` contains all information for the file
     * 
     * @param {FileObj} fileObj 
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     */
    addNewFileObj(fileObj, insert) {
        this.addNewFile(fileObj.name, fileObj.contents, fileObj.description, insert);
    }

    /**
     * Create a new file in this package and return a object for populating its contents.
     * If the complete contents of the file are already available at this point in time, 
     * use the simpler {@link addNewFile} instead
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     * let packageFile = myPackage.getNewFile("myfile.txt", "test file");
     * packageFile.contents = "hello world!\n";
     * myPackage.makePackage("C:\\Temp");
     * 
     * @param {string} fileName filename within this package
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    getNewFile(fileName, description, insert) {
        if(description === undefined) {
            description = "";
        }

        if(insert && insert == true) {
            this._objects.unshift({type:"File", name:fileName, attributes:"", description:description, contents:""});
            return this._objects[0];
        }
        else {
            this._objects.push({type:"File", name:fileName, attributes:"", description:description, contents:""});
            return this._objects[this._objects.length-1];
        }
    }

    /**
     * Create a new file in this package using a {@link FileObj} object and return a object for populating its contents.
     * Same as the {@link getNewFile} whereas the `fileObj` contains all information for the file
     * 
     * @param {FileObj} fileObj 
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     * @returns {FileObj} the fileobj within this package to be further manipulated
     */
    getNewFileObj(fileObj, insert) {
        return this.getNewFile(fileObj.name, fileObj.contents, fileObj.description, insert);
    }

    /**
     * Add a file to this package, which is created externally.
     * In contrast to {@link getNewFile}, {@link addExistingFile} doesnt return any object, because we expect that the file
     * is already there, or gets created by some other means (outside the {@link ExosPackage})
     * 
     * @param {string} fileName filename within this package
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     */
    addExistingFile(fileName, description, insert) {
        if(description === undefined) {
            description = "";
        }

        //add it as a "ExistingFile", that we dont consider to write the contents at _createPackage as we do with "Files"
        if(insert && insert == true) {
            this._objects.unshift({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
        }
        else {
            this._objects.push({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
        }
    }

    /** 
     * internal function to create the package (folder) and write all the file contents
     * including the package file (Package.pkg or ANSIC.lby etc.) to a specific location
     * The package file contents (this._pkgFile.contents) must be populated first
     * */
    _createPackage(location) {
        //console.log(`Creating package folder: ${path.join(location,this._folderName)}`);
        if (!fs.existsSync(location)) {
            throw(`Package: folder does not exist: ${location}`);
        }
        
        if (fs.existsSync(path.join(location,this._folderName))) {
            throw(`Package: folder already exists: ${path.join(location,this._folderName)}`);
        }

        fs.mkdirSync(path.join(location,this._folderName));

        //console.log(`Creating package file: ${path.join(location,this._pkgFile.name)}`);
        fs.writeFileSync(path.join(location,this._folderName,this._pkgFile.name),this._pkgFile.contents);

        for (const obj of this._objects) {
            if(obj.type == "File") {
                //console.log(`Creating file: ${path.join(location,obj.name)}`);
                fs.writeFileSync(path.join(location,this._folderName,obj.name), obj.contents);
            }
        }
    }

    /**
     * internal function to update a package with its file (contents) if the file and the folder exist.
     * 
     * If the file doesnt exist, the function returns
     * NOT including Package.pkg or or ANSIC.lby etc, because these are not entirely controlled
     * by the Package if its just being updated, meaning the pkg/lby/iec files can have been
     * changed in AS, and we dont know about that here 
     * 
     * @param {boolean} createFiles create files if they do not yet exist (dont create folders)
     * 
     * @returns {UpdatePackageResults} Information about this update (files updated, files found..)
     */
    _updatePackage(location, createFiles) {
        /**
         * @type {UpdatePackageResults}
         */
        let result = {filesUpdated:0, filesNotFound:0, foldersNotFound:0};
        if(fs.existsSync(path.join(location,this._folderName))) {
            for (const obj of this._objects) {
                if(obj.type == "File") {
                    
                    //update the file if it exists
                    if(createFiles || fs.existsSync(path.join(location,this._folderName,obj.name))) {
                        fs.writeFileSync(path.join(location,this._folderName,obj.name), obj.contents);
                        result.filesUpdated++;
                    }
                    else {
                        result.filesNotFound++;
                    }
                    
                }
            }   
        }
        else {
            result.foldersNotFound++;
        }
        return result;
    }
}




/**
 * Class for the Linux package, that contain specific shortcut commands to populate the 
 * {@link ExosPkg} object within the {@link ExosPackage} that the {@link LinuxPackage} is created.
 * An {@link ExosPackage} can only contain one {@link ExosPkg} but several {@link LinuxPackage}'s.
 * 
 * A new {@link LinuxPackage} class is created from the {@link ExosPackage.getNewLinuxPackage},
 * whereas it could also be used standalone
 * 
 * @example
 * 
 * //within the ExosPackage:
 * let myPackage = new ExosPackage("MyPackage");
 * let linux = myPackage.getNewLinuxPackage("Linux", "Linux Package");   
 * 
 * //Standalone usage:
 * let exosPkg = new ExosPkg();
 * let linux = new LinuxPackage(exosPkg, "Linux");
 *  
 */
class LinuxPackage extends Package {

    constructor(exosPkg, name) {

        super(name, "Package.pkg");

        this._header  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._header  += `<Package SubType="exosLinuxPackage" PackageType="exosLinuxPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
        this._header  += `  <Objects>\n`;
        
        this._footer += `  </Objects>\n`;
        this._footer += `</Package>\n`;

        //the exosPkg is a reference to the ExosPkg object inside ExosPackage
        this._exosPkg = exosPkg;
    }

    /**
     * Create the {@link LinuxPackage} in the file system with all its current files.
     * This method is impliclitly called by {@link ExosPackage.makePackage}, so it
     * is only in specific cases that this method is used.
     * 
     * @example
     * //Standalone usage:
     * let exosPkg = new ExosPkg();
     * let linux = new LinuxPackage(exosPkg, "Linux");
     * let buildFile = linux.getNewFile("build.sh");
     * buildFile.contents = "echo 'this is a test'\n";
     * linux.makePackage("C:\\Temp");
     * 
     * @param {string} location path where this package (folder + files) should be created
     */
    makePackage(location) {
        //fill the package specific contents
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            if(obj.description === undefined) {
                obj.description = "";
            }
            //we only write "File" for the objects, because some _objects have special type properties (like "ExistingFile")
            this._pkgFile.contents += `    <Object Type="File" Description="${obj.description}">${obj.name}</Object>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);
    }

    /**
     * Shortcut method (also populating the {@link ExosPkg}) for adding an existing file that should be transferred to the target system
     * 
     * The method doesnt return a file object to be populated, because we expect that the file
     * is already there, or gets created by some other means outside the {@link ExosPackage}
     * 
     * 
     * @param {string} fileName name of the file (within the Linux package) that should be transferred to the target system
     * @param {string} changeEvent `Ignore` | `Restart` | `Reinstall` - behaviour of the target component when file is added, removed or changed. 
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     */
    addExistingTransferFile(fileName, changeEvent, description, insert) {
        if(description === undefined) {
            description = "";
        }
        //add this file to the exosPackage with a relative path to this package
        this._exosPkg.addFile(path.join(this._folderName,fileName),changeEvent);
        //add it as a "ExistingFile", that the super Package class doesnt consider to write the contents at _createPackage as it does with "Files"
        if(insert && insert == true) {
            this._objects.unshift({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
        }
        else {
            this._objects.push({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
        }
    }
    
    /**
     * Shortcut method (also populating the {@link ExosPkg}) for adding a file that can be populated and should be transferred to the target system
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     * let linux = myPackage.getNewLinuxPackage("Linux");   
     * let script = linux.getNewTransferFile("index.js", "Restart", "Main JS script");
     * script.contents = ..
     * myPackage.makePackage();
     * 
     * @param {string} fileName name of the file (within the Linux package) that should be transferred to the target system
     * @param {string} changeEvent `Ignore` | `Restart` | `Reinstall` - behaviour of the target component when file is added, removed or changed. 
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    getNewTransferFile(fileName, changeEvent, description, insert) {
        if(description === undefined) {
            description = "";
        }
        //add this file to the exosPackage with a relative path to this package
        this._exosPkg.addFile(path.join(this._folderName,fileName),changeEvent);
        //return a new standard file where the contents can be populated
        return super.getNewFile(fileName, description, insert);
    }

    /**
     * Shortcut method (also populating the {@link ExosPkg}) for adding a file object with its contents that should be transferred to the target system.
     * 
     * This is equivalent to using {@linkcode Package.addNewFileObj} and {@linkcode ExosPkg.addFile}
     * 
     * @param {FileObj} fileObj 
     * @param {string} changeEvent 
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     */
    addNewTransferFileObj(fileObj, changeEvent, insert) {
        //add this file to the exosPackage with a relative path to this package
        this._exosPkg.addFile(path.join(this._folderName,fileObj.name),changeEvent);
        super.addNewFileObj(fileObj, insert);
    }


    /**
     * Shortcut method (also populating the {@link ExosPkg}) for adding an existing .deb file that should be transferred to the target system, and triggers a component reinstallation when changed
     * In the {@link ExosPkg}, it creates a file for transfer, as well as an `Install` and `Remove` service, that calls the `dpkg` command.
     * The .deb file certainly is assumed to be created externally, and therefore the method doesnt return a file object to be populated.
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     * let linux = myPackage.getNewLinuxPackage("Linux");   
     * linux.addExistingTransferDebFile("exos-comp-mouse_1.0.0.deb", "exos-comp-mouse", "Debian Package");
     * myPackage.makePackage();
     * 
     * @param {string} fileName name of the Debian package file within the Linux Package, e.g. `exos-comp-mouse_1.0.0.deb`
     * @param {string} packageName name of the Debian package once installed on the system, e.g. `exos-comp-mouse`
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     */
    addExistingTransferDebFile(fileName, packageName, description, insert) {
        if(description === undefined) {
            description = "";
        }
        //add this file to the exosPackage with a relative path to this package with the Reinstall attribute
        this._exosPkg.addFile(path.join(this._folderName,fileName),"Reinstall");
        this._exosPkg.addService("Install",`dpkg -i ${fileName}`);
        this._exosPkg.addService("Remove",`dpkg --purge ${packageName}`);
        //add it as a "ExistingFile", that the super Package class doesnt consider to write the contents at _createPackage as it does with "Files"
        if(insert && insert == true) {
            this._objects.unshift({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
        }
        else {
            this._objects.push({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
        }
    }

    /**
     * Shortcut method(also populating the {@link ExosPkg}) to create a file that is populated and is added as a build dependency. The file is not (automatically) transferred to the target.
     * Use this function if the complete contents of the file are available, otherwise use the {@link getNewBuildFile} that returns a mutable {@link FileObj}
     * 
     * @example 
     * let myPackage = new ExosPackage("MyPackage");
     * let linux = myPackage.getNewLinuxPackage("Linux");   
     * linux.addNewFile("build.sh", "echo 'this is a test'\n");
     * let build = myPackage.exospkg.getNewWSLBuildCommand("Linux","build.sh");
     * 
     * linux.addNewBuildFile(build, "source.c", getTheSourceCode(), "Source Code");
     * myPackage.makePackage();
     * 
     * @param {object} buildCommand object returned from {@link ExosPkg.getNewBuildCommand} or {@link ExosPkg.getNewWSLBuildCommand}
     * @param {string} fileName name of the file within the Linux package
     * @param {string} contents contents of the file that is to be stored on disk
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    addNewBuildFile(buildCommand, fileName, contents, description, insert) {
        if(description === undefined) {
            description = "";
        }
        //add a build dependency to this file
        this._exosPkg.addBuildDependency(buildCommand,path.join(this._folderName,fileName));
        //return a new standard file where the contents can be populated
        super.addNewFile(fileName, contents, description, insert);
    }

    /**
     * Shortcut method(also populating the {@link ExosPkg}) to create a file that is populated and is added as a build dependency.
     * 
     * Same as {@link addNewBuildFile} but using a fileObj to simplify the usage
     * 
     * @param {object} buildCommand 
     * @param {FileObj} fileObj 
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     */
    addNewBuildFileObj(buildCommand, fileObj, insert) {
        this.addNewBuildFile(buildCommand, fileObj.name, fileObj.contents, fileObj.description, insert);
    }

    /**
     * Shortcut method(also populating the {@link ExosPkg}) to create a {@link FileObj} that can be populated and is added as a build dependency. The file is not (automatically) transferred to the target.
     * If the complete contents of the file are already available, use the simpler {@link addNewBuildFile()} instead.
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     * let linux = myPackage.getNewLinuxPackage("Linux");   
     * let buildFile = linux.getNewFile("build.sh");
     * let build = myPackage.exospkg.getNewWSLBuildCommand("Linux","build.sh");
     * buildFile.contents = "echo 'this is a test'\n";
     * let sourceFile = linux.getNewBuildFile(build, "source.c", "Source Code");
     * sourceFile.contents = .. 
     * myPackage.makePackage();
     * 
     * @param {object} buildCommand object returned from {@link ExosPkg.getNewBuildCommand} or {@link ExosPkg.getNewWSLBuildCommand()}
     * @param {string} fileName name of the file within the Linux package
     * @param {string} [description] description that will appear in AS
     * @param {boolean} [insert] in case the file should be placed at the beginning of the package rather than at the end
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    getNewBuildFile(buildCommand, fileName, description, insert) {
        if(description === undefined) {
            description = "";
        }
        //add a build dependency to this file
        this._exosPkg.addBuildDependency(buildCommand,path.join(this._folderName,fileName));
        //return a new standard file where the contents can be populated
        return super.getNewFile(fileName, description, insert);
    }
}

/**
 * Class for IEC Programs that inherits {@link Package.getNewFile} and {@link Package.addExistingFile}
 * Implicitly generated from the {@link ExosPackage.getNewIECProgram}
 * 
 * @example
 * let myPackage = new ExosPackage("MyPackage");
 * let program = myPackage.getNewIECProgram("Program", "Sample Program");   
 * 
 * //Standalone usage:
 * let program = new IECProgram("Program");
 */
class IECProgram extends Package {
    constructor(name) {

        super(name, "IEC.prg");

        this._header  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._header  += `<Program SubType="IEC" xmlns="http://br-automation.co.at/AS/Program">\n`;
        this._header  += `  <Files>\n`;
        
        this._footer += `  </Files>\n`;
        this._footer += `</Program>\n`;
    }

    /**
     * Create the {@link IECProgram} in the file system with all its current files.
     * This method is impliclitly called by {@link ExosPackage.makePackage}, so it
     * is only in specific cases that this method is used.
     * 
     * @example
     * //Standalone usage:
     * let program = new IECProgram("Program");
     * let programVar = program.getNewFile("Program.var", "Local Variables");
     * programVar.contents = "VAR\n\nEND_VAR\n";
     * program.makePackage("C:\\Temp")
     * 
     * @param {string} location path where this package (folder + files) should be created
     */
    makePackage(location) {
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <File Description="${obj.description}">${obj.name}</File>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);
    }
}

/**
 * Class for C/C++ Libraries that inherits {@link Package.getNewFile} and {@link Package.addExistingFile}
 * Implicitly generated from the {@link ExosPackage.getNewCLibrary}
 * 
 * @example
 * let myPackage = new ExosPackage("MyPackage");
 * let library = myPackage.getNewCLibrary("Library", "Sample Library");   
 * 
 * //Standalone usage:
 * let library = new CLibrary("Library");
 */
class CLibrary extends Package {
    constructor(name) {

        super(name, "ANSIC.lby");

        this._header  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._header  += `<Library SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Library">\n`;
        this._header  += `  <Files>\n`;
        
        this._footer += `  </Files>\n`;
        this._footer += `  <Dependencies>\n`;
        this._footer += `    <Dependency ObjectName="ExData" />\n`;
        this._footer += `  </Dependencies>\n`;
        this._footer += `</Library>\n`;
    }

    /**
     * Create the {@link CLibrary} in the file system with all its current files.
     * This method is impliclitly called by {@link ExosPackage.makePackage()}, so it
     * is only in specific cases that this method is used.
     * 
     * @example
     * //Standalone usage:
     * let library = new CLibrary("Library");
     * let libraryFun = program.getNewFile("Library.fun", "Function blocks and functions");
     * libraryFun.contents = ..;
     * library.makePackage("C:\\Temp")
     * 
     * @param {string} location path where this package (folder + files) should be created
     */
    makePackage(location) {
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <File Description="${obj.description}">${obj.name}</File>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);
    }
}


/**
 * Main class for exOS Packages
 * 
 * This is the first goto when creating packages for exOS. The class has a built-in {@link ExosPkg} and contains generators for {@link CLibrary}, {@link IECProgram} and {@link LinuxPackage},
 * and generates all created objects with one single {@link makePackage}. The {@link ExosPackage} is created with a name, which is the name of the folder 
 * in the filesystem and the implicitly created .exospkg file
 * 
 * It defines the {@link FileObj} object that is used for populating files
 * 
 * @typedef {Object} FileObj file object that can be manipulated before calling `makePackage()`
 * @property {string} contents contents of the file that is to be stored on disk e.g. "hello world!\n"
 * @property {string} name name of the file stored on disk, eg. "myfile.txt"
 * @property {string} description description of the file inside the AS project
 * 
 * @example
 * let myPackage = new ExosPackage("MyPackage");
 * let sampleFile = myPackage.getNewFile("sample.txt", "Sample File");
 * sampleFile.contents = "hello world!\n";
 * ..
 * myPackage.makePackage("C:\\Temp");
 *
 */
class ExosPackage extends Package {

    constructor(name) {

        super(name, "Package.pkg");

        this._header += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header += `<?AutomationStudio FileVersion="4.9"?>\n`;
        this._header += `<Package SubType="exosPackage" PackageType="exosPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
        this._header += `  <Objects>\n`;

        this._footer = "";
        this._footer += `  </Objects>\n`;
        this._footer += `</Package>\n`;

        this._exosPkgFile = this.getNewFile(`${name}.exospkg`,"exOS package description");
        this._exosPkg = new ExosPkg();
    }

    /**
     * Create the {@link ExosPackage} in the file system with all its current files and packages.
     * 
     * The {@link ExosPackage} can contain files (inherited from {@link Package}) as well as further packages, like {@link CLibrary} {@link IECProgram} and {@link LinuxPackage},
     * and has a built-in {@link ExosPkg}. When calling this method, all of the contained files and packes are created by calling their respective {@link makePackage}.
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     *   
     * let sampleFile = myPackage.getNewFile("sample.txt", "Sample File");
     * sampleFile.contents = "hello world!\n";
     * 
     * let library = myPackage.getNewCLibrary("Library", "Sample Library");
     * let libraryFile = library.getNewFile("header.h", "Sample Header");
     * libraryFile.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";
     * 
     * let program = myPackage.getNewIECProgram("Program", "Sample Program");
     * let programVar = program.getNewFile("Program.var", "Local Variables");
     * programVar.contents = "VAR\n\nEND_VAR\n";
     * programSt = program.getNewFile("Program.st", "Local Variables");
     * programSt.contents = "PROGRAM _CYCLIC\n\nEND_PROGRAM\n";
     * 
     * //create the "MyPackage" with "sample.txt", 
     * //the "Library" - with "header.h",
     * //the "Program" with "Program.var" and "Program.st"
     * myPackage.makePackage();
     * 
     * @param {string} location path where this package and all its sub packages (folders + files) should be created
     */
    makePackage(location) {
        
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <Object Type="${obj.type}" ${obj.attributes} Description="${obj.description}">${obj.name}</Object>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._exosPkgFile.contents = this._exosPkg.getContents();

        this._createPackage(location);

        for (const obj of this._objects) {
            if(obj.type == "Library" || obj.type == "Program" || obj.type == "Package")
            {
                obj._object.makePackage(path.join(location,this._folderName));
            }
        }
    }

    /**
     * Update the ExosPackage by writing all files that already exist on disk
     * 
     * The location is the same that is used in {@linkcode makePackage}, that is the location of the `ExosPackage` **folder**.
     * 
     * for example `C:\Temp` if we previously created a `MyPackage` there with the contents in `C:\Temp\MyPackage`
     * 
     * @param {string} location path where this package and all its sub packages (folders + files) is located
     * @param {boolean} createFiles create files if they do not yet exist (dont create folders)
     * 
     * @returns {UpdatePackageResults} information about how many files were updated, and how many failed.
     */
    updatePackage(location, createFiles) {
        /**
         * @type {UpdatePackageResults}
         */
        let result = {filesUpdated:0, filesNotFound:0, foldersNotFound:0};
        
        this._exosPkgFile.contents = this._exosPkg.getContents();

        this._updatePackage(location, createFiles);

        for (const obj of this._objects) {
            if(obj.type == "Library" || obj.type == "Program" || obj.type == "Package")
            {
                /**
                 * @type {UpdatePackageResults}
                 */
                let objResult = obj._object._updatePackage(path.join(location,this._folderName), createFiles);
                result.filesNotFound += objResult.filesNotFound;
                result.filesUpdated += objResult.filesUpdated;
                result.foldersNotFound += objResult.foldersNotFound;
            }
        }
        return result;
    }

    /**
     * The {@link ExosPackage} contains a built-in {@link ExosPkg} which is passed on to all {@link LinuxPackage}'s that are created.
     * This property accesses the builtin {@link ExosPkg} object
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     * myPackage.exospkg.addGenerateDatamodel("Types.typ","Types",[],[]); //add a command to the built-in ExosPkg
     * let linux = myPackage.getNewLinuxPackage("Linux");   
     * let script = linux.getNewTransferFile("index.js", "Restart", "Main JS script"); //this also accesses the built-in ExosPkg
     *   
     * @returns {ExosPkg} object
     */
    get exospkg() {
        return this._exosPkg;
    }

    /**
     * Create a new {@link LinuxPackage} object within the {@link ExosPackage}.
     *
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     * let linux = myPackage.getNewLinuxPackage("Linux"); 
     * linux.addExistingTransferDebFile("exos-comp-mouse_1.0.0.deb", "exos-comp-mouse", "Debian Package");
     * myPackage.makePackage();
     * 
     * @param {string} name Name of the Linux package (and the folder in the file system)
     * @param {string} [description] description that will appear in AS
     * @returns {LinuxPackage} 
     */
    getNewLinuxPackage(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Package", name:name, attributes:"", description:description, _object:new LinuxPackage(this._exosPkg, name)});
        return this._objects[this._objects.length-1]._object;
    }

    /**
     * Create a new {@link CLibrary} object within the {@link ExosPackage}.
     *
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     *   
     * let library = myPackage.getNewCLibrary("Library", "Sample Library");
     * let libraryFile = library.getNewFile("header.h", "Sample Header");
     * libraryFile.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";
     * 
     * myPackage.makePackage();     
     *  
     * @param {string} name Name of the C/C++ Library (and the folder in the file system)
     * @param {string} [description] description that will appear in AS
     * @returns {CLibrary}
     */
    getNewCLibrary(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Library", name:name, attributes:"Language=\"ANSIC\"", description:description, _object:new CLibrary(name)});

        return this._objects[this._objects.length-1]._object;
    }

    /**
     * Create a new {@link IECProgram} object within the {@link ExosPackage}.
     * 
     * @example
     * let myPackage = new ExosPackage("MyPackage");
     *   
     * let program = myPackage.getNewIECProgram("Program", "Sample Program");
     * let programVar = program.getNewFile("Program.var", "Local Variables");
     * programVar.contents = "VAR\n\nEND_VAR\n";
     * programSt = program.getNewFile("Program.st", "Local Variables");
     * programSt.contents = "PROGRAM _CYCLIC\n\nEND_PROGRAM\n";
     * 
     * myPackage.makePackage();
     * 
     * @param {string} name Name of the IEC Program (and the folder in the file system) 
     * @param {string} [description] description that will appear in AS
     * @returns {IECProgram}
     */
    getNewIECProgram(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Program", name:name, attributes:"Language=\"IEC\"", description:description, _object:new IECProgram(name)});

        return this._objects[this._objects.length-1]._object;
    }

}


if (require.main === module) {
    
    if (process.argv.length > 2) {

        let folder = process.argv[2];
        let packageName = process.argv[3];

        let mypackage = new ExosPackage(packageName);
        
        let sampleFile = mypackage.getNewFile("sample.txt", "Sample File");
        sampleFile.contents = "hello world!\n";

        let library = mypackage.getNewCLibrary("Library", "Sample Library");
        let libraryFile = library.getNewFile("header.h", "Sample Header");
        libraryFile.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";
        
        let program = mypackage.getNewIECProgram("Program", "Sample Program");
        let programVar = program.getNewFile("Program.var", "Local Variables");
        programVar.contents = "VAR\n\nEND_VAR\n";
        programSt = program.getNewFile("Program.st", "Local Variables");
        programSt.contents = "PROGRAM _CYCLIC\n\nEND_PROGRAM\n";
        
        linux = mypackage.getNewLinuxPackage("Linux", "");

        let wslBuild = mypackage.exospkg.getNewWSLBuildCommand("Linux", "build.sh");
        linuxHeader = linux.getNewBuildFile(wslBuild, "header.h", "Sample Header");
        linuxHeader.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";

        mypackage.makePackage(path.join(__dirname, folder));
    }
    else {
        process.stderr.write("usage: ./ExosPackage.js <folder> <packagename>\n");
    }
}

module.exports = {Package, ExosPackage, CLibrary, IECProgram, ExosPkg, LinuxPackage};