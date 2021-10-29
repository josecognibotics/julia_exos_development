const fs = require('fs');
const path = require('path');

//shortcut to get an arrays last (pushed) element
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

/**
 * Base class for Packages, used for inheritance
 * 
 */
class Package {

    constructor(name) {

        this._folderName = name;
        this._objects = [];
        this._pkgFile = {};
        this._header = "";
        this._footer = "";
        
    }

    /**
     * Create a new file in this package and populate its contents
     * Use this method if the complete file contents are already available, 
     * otherwise use the `getNewFile()` which returns a mutable `FileObj` that can be populated with contents
     * 
     * For example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *      myPackage.addNewFile("myfile.txt", "hello world!\n", "test file");
     *      myPackage.makePackage("C:\\Temp");
     * 
     * @param {string} fileName filename within this package
     * @param {string} contents contents of the file that is to be stored on disk e.g. "hello world!\n"
     * @param {string} description (optional) description that will appear in AS
     * 
     */
    addNewFile(fileName, contents, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"File", name:fileName, attributes:"", description:description, contents:contents});
        return this._objects.last();
    }

    /**
     * Create a new file in this package and return a object for populating its contents
     * If the complete contents of the file are already available at this point in time, 
     * use the simpler `addNewFile()` instead
     * 
     * For example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *      let packageFile = myPackage.getNewFile("myfile.txt", "test file");
     *      packageFile.contents = "hello world!\n";
     *      myPackage.makePackage("C:\\Temp");
     * 
     * @param {string} fileName filename within this package
     * @param {string} description (optional) description that will appear in AS
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    getNewFile(fileName, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"File", name:fileName, attributes:"", description:description, contents:""});
        return this._objects.last();
    }

    /**
     * Add a file to this package, which is created externally.
     * In contrast to getNewFile(), addExistingFile() doesnt return any object, because we expect that the file
     * is already there, or gets created by some other means, like the GenerateDatamodel
     * 
     * @param {string} fileName filename within this package
     * @param {string} description (optional) description that will appear in AS
     */
    addExistingFile(fileName, description) {
        if(description === undefined) {
            description = "";
        }

        //add it as a "ExistingFile", that we dont consider to write the contents at _createPackage as we do with "Files"
        this._objects.push({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
    }

    /** 
     * internal function to create the package (folder) and write all the file contents
     * including the package file (Package.pkg or ANSIC.lby etc.) to a specific location
     * The package file contents (this._pkgFile.contents) must be populated first
     * */
    _createPackage(location) {
        console.log(`Creating package folder: ${path.join(location,this._folderName)}`);
        fs.mkdirSync(path.join(location,this._folderName));

        console.log(`Creating package file: ${path.join(location,this._pkgFile.name)}`);
        fs.writeFileSync(path.join(location,this._folderName,this._pkgFile.name),this._pkgFile.contents);

        for (const obj of this._objects) {
            if(obj.type == "File") {
                console.log(`Creating file: ${path.join(location,obj.name)}`);
                fs.writeFileSync(path.join(location,this._folderName,obj.name), obj.contents);
            }
        }
    }
}

/**
 * Class for the .exospkg file, created within an ExosPackage and accessed via `exospkg`
 * It contains metods to populate the contents of an .exospkg, and returns the XML contents
 * via `getContents()` - whereas this function is called implicitly by the ExosPackage `makePackage()`
 * 
 * For example:
 * 
 *      let myPackage = new ExosPackage("MyPackage");
 *      myPackage.exospkg.addService("Runtime","/home/user/myexecutable");
 *      myPackage.makePackage("C:\\Temp");
 * 
 */
class ExosPkg {

    //all items in the exospkg are added as json objects, which are parsed out in the getContents()
    constructor() {
        this._files = [];
        this._services = [];
        this._datamodels = [];
        this._generateDatamodels = [];
        this._buildCommands = [];
    }

    /**
     * Add a file to be transferred to the target system
     * 
     * @param {string} fileName name and relative location of the file, like "Linux/myFile.txt"
     * @param {string} changeEvent `Ignore` | `Restart` | `Reinstall` - behaviour of the target component when file is added, removed or changed. 
     */
    addFile(fileName, changeEvent) {
        this._files.push({fileName:fileName, changeEvent:changeEvent});
    }

    /**
     * Add a service to be executed on the target system
     * 
     * @param {string} type `Install` | `Remove` | `Startup` | `Runtime`
     * @param {string} command commandline to be executed, like "/home/user/myexecutable" or "cp myFile.txt /home/user/"
     * @param {string} workingDirectory (optional) working directory of the service, like "/home/user". If omitted, the deployment directory of the component is used
     */
    addService(type, command, workingDirectory) {
        this._services.push({type:type,command:command,workingDirectory:workingDirectory});
    }

    /**
     * Add a communication channel (datamodel instance) to the datacommunication for exchanging data with the target system
     * 
     * @param {string} name The `datamodel_instance_name` provided in the `exos_datamodel_connect_{type}()` function of the application
     */
    addDatamodelInstance(name) {
        this._datamodels.push({name:name});
    }

    /**
     * Add a compiler command to generate datamodel header/source files for datacommunication in the exOS TP.
     * 
     * **Regarding `SG4Includes`:**
     * 
     * In most cases, exos components are created from IEC .typ files which also exist in AS and that generate a C-declaration
     * of this type which can be included in C-programs. For example, if the .typ file is within "TypeLib", then "TypeLib.h"
     * should be added as SG4 include, that the C-Program can utilize the library functions without clashing with the generated
     * C-datatypes in the generated c/h datamodel files in AR.
     * 
     * **Regarding `outputPaths`:**
     * 
     * The exOS TP GenerateDatamodel needs an output directory for the generated files, like the name of a library or a linux folder.
     * The in each of these directories, the functionality creates two files. The filenames are accessed via the `Datamodel` class (see example).
     * These files need to be added as `addExistingFile()` (currently without content) or `addNewFile` (with generated content) within 
     * the packages defined as `OutputPaths`
     *
     * **Note:**
     * 
     * This method does not actually *generate* the files, it only populates the .exospkg file with the instruction for the exOS TP.
     * If the files should be created together with creating the `ExosPackage`, the `Datamodel` class should be used to create the datamodel file contents.
     * 
     * For example
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux");
     *      let lib = myPackage.getNewCLibrary("TypeLib");
     *      //generate the datamodel file contents
     *      let datamodel = new Datamodel("TypeLib/Types.typ", "Types", ["TypeLib.h"]);
     *      //set exOS TP to generate files in the "TypeLib" and "Linux" directories, and include the "TypeLib" library in AR
     *      myPackage.exospkg.addGenerateDatamodel("TypeLib/Types.typ", "Types", ["TypeLib.h"], ["TypeLib", "Linux"]);
     * 
     *      //add the generated files to the "TypeLib" and "Linux" packages, and populate the contents from the parsed datamodel
     *      linux.addNewFile(datamodel.headerFileName, datamodel.headerFileCode); 
     *      linux.addNewFile(datamodel.sourceFileName, datamodel.sourceFileCode);
     *      lib.addNewFile(datamodel.headerFileName, datamodel.headerFileCode);
     *      lib.addNewFile(datamodel.sourceFileName, datamodel.sourceFileCode);
     *      
     * 
     * @param {string} fileName Name of the IEC .typ file that contains the datatype, relative to the exospkg location
     * @param {string} typeName Name of the datatype withing the .typ file
     * @param {string[]} SG4Includes list of specific `_SG4` include directives to include the datatype generated from the IEC `typeName` file in Automation Studio
     * @param {string[]} outputPaths list of directories relative to the .exospkg where the c/h files are generated to
     * 
     * @returns {GenerateDatamodelFiles} filenames for the generated datamodel header/source files
     */
    addGenerateDatamodel(fileName, typeName, SG4Includes, outputPaths) {
        if(!Array.isArray(SG4Includes)) {
            SG4Includes = [];
        }
        if(!Array.isArray(outputPaths)) {
            outputPaths = [];
        }
        this._generateDatamodels.push({fileName:fileName,typeName:typeName,SG4Includes:SG4Includes,outputPaths:outputPaths});
    }

    /**
     * The exOS TP can call an external build command before building the rest of the system. This can be
     * utilized to compile linux sources on the local computer.
     * 
     * exOS in itself has no dependency to an external build system, and only forwards the output, or 
     * possible errors (stderr) to the AS Build Output. In most cases, WSL is a good option for building
     * Linux sources, and this build command is added via the simplified `getNewWSLBuildCommand()`
     * 
     * @param {string} command Command to be executed on the local computer
     * @param {string} workingDirectory Working directory of the build command on the local computer
     * @param {string} args Arguments passed to the build command
     * @returns {object} object that can be further populated with file dependencies using `addBuildDependency()`
     */
    getNewBuildCommand(command, workingDirectory, args) {
        this._buildCommands.push({command:command, workingDirectory:workingDirectory, args:args, Dependencies:[]});
        return this._buildCommands.last();
    }

    /**
     * Call a predefined wsl build command that runs a script on the local Debian WSL distribution 
     * 
     * For example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux")    
     *      let buildFile = linux.getNewFile("build.sh", "Build Script");
     *      buildFile.contents = "echo 'this is a test'\n";
     *      let build = myPackage.exospkg.getNewWSLBuildCommand("Linux","build.sh");
     * 
     * @param {string} buildScript name of the scriptfile that is being executed in the `linuxPackage`, e.g. `build.sh`
     * @param {string} linuxPackage name of the Linux package where the `buildScript` is located
     * @returns {object} object that can be further populated with file dependencies using `addBuildDependency()`
     */
    getNewWSLBuildCommand(linuxPackage, buildScript) {
        return this.getNewBuildCommand("C:\\Windows\\Sysnative\\wsl.exe",linuxPackage,`-d Debian -e sh ${buildScript}`);
    }

    /**
     * Add a dependency for the exOS TP build process, that a file can be monitored for changes that will trigger the build command to run.
     * The LinuxPackage has a shortcut to add files including adding them as build dependencies with `getNewBuildFile()`
     * 
     * For example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux")    
     *      let buildFile = linux.getNewFile("build.sh");
     *      buildFile.contents = "echo 'this is a test'\n";
     *      let sourceFile = linux.getNewFile("source.c", "Source Code");
     *      sourceFile.contents = ..*      
     *      let build = myPackage.exospkg.getNewWSLBuildCommand("Linux","build.sh");
     *      myPackage.exospkg.addBuildDependency(build,"Linux/source.c"); //monitor source.c for changes
     * 
     * 
     * @param {object} buildCommand object returned from `getNewBuildCommand()` or `getNewWSLBuildCommand()`
     * @param {string} fileName filename including the path relative to the .exospkg that should be added as build dependency
     */
    addBuildDependency(buildCommand, fileName) {
        buildCommand.Dependencies.push(fileName);
    }

    /**
     * When all files, services, datamodels etc. have been added, the .exospkg file can be created using `getContents()`.
     * This function is called implicitly by `makePackage()` in the `ExosPackage` class, which contains an internal ExosPkg object.
     * It can be used for custom `ExosPkg` objects, or just to get the contents of the file
     * 
     * For example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *      myPackage.exospkg.addService("Runtime","/home/user/myexecutable");
     *      console.log(myPackage.exospkg.getContents()); //display the output of the .exospkg file
     * 
     * @returns {string} the XML file contents of the .exospkg file
     */
    getContents()
    {
        let out = ``;

        out += `<?xml version="1.0" encoding="utf-8"?>\n`;
        out += `<ComponentPackage Version="1.1.0" ErrorHandling="Component" StartupTimeout="0">\n`;
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
            out += `    <DataModelInstance Name="${datamodel.name}"/>\n`;
        }

        if(this._generateDatamodels.length > 0 || this._buildCommands.length > 0)
        {
            out += `    <Build>\n`;
            for(const generateDatamodel of this._generateDatamodels) {
                out += `        <GenerateDatamodel FileName="${generateDatamodel.fileName}" TypeName="${generateDatamodel.typeName}">\n`;
                for(const SG4Include of generateDatamodel.SG4Includes) {
                    out += `            <SG4 Include="${SG4Include}"/>\n`;
                }
                for(const outputPath of generateDatamodel.outputPaths) {
                    out += `            <Output Path="${outputPath}"/>\n`;
                }
                out += `        </GenerateDatamodel>\n`;
            }
            for(const buildCommand of this._buildCommands) {
                out += `        <BuildCommand Command="${buildCommand.command}" WorkingDirectory="${buildCommand.workingDirectory}" Arguments="${buildCommand.args}">\n`;
                for(const dependency of buildCommand.Dependencies) {
                    out += `            <Dependency FileName="${dependency}"/>\n`;
                }
                out += `        </BuildCommand>\n`;
            }
            
            out += `    </Build>\n`;
        }
        out += `</ComponentPackage>\n`;
        return out;
    }
}


/**
 * Class for the Linux package, that contain specific shortcut commands to populate the 
 * `ExosPkg` object within the `ExosPackage` that the `LinuxPackage` is created.
 * An `ExosPackage` can only contain one `ExosPkg` but several `LinuxPackage`'s.
 * 
 * A new `LinuxPackage` class is created from the `ExosPackage` via `getNewLinuxPackage()`,
 * whereas it could also be used standalone
 * 
 * Example:
 * 
 *      let myPackage = new ExosPackage("MyPackage");
 *      let linux = myPackage.getNewLinuxPackage("Linux", "Linux Package");   
 * 
 * Standalone usage:
 * 
 *      let exosPkg = new ExosPkg();
 *      let linux = new LinuxPackage(exosPkg, "Linux");
 *  
 */
class LinuxPackage extends Package {

    constructor(exosPkg, name) {

        super(name);

        this._header  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._header  += `<Package SubType="exosLinuxPackage" PackageType="exosLinuxPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
        this._header  += `  <Objects>\n`;
        
        this._footer += `  </Objects>\n`;
        this._footer += `</Package>\n`;

        this._pkgFile = {type:"File", name:"Package.pkg", contents:""};

        //the exosPkg is a reference to the ExosPkg object inside ExosPackage
        this._exosPkg = exosPkg;
    }

    /**
     * Create the `LinuxPackage` in the file system with all its current files.
     * This method is impliclitly called by `ExosPackage.makePackage()`, so it
     * is only in specific cases that this method is used.
     * 
     * Standalone usage:
     * 
     *      let exosPkg = new ExosPkg();
     *      let linux = new LinuxPackage(exosPkg, "Linux");
     *      let buildFile = linux.getNewFile("build.sh");
     *      buildFile.contents = "echo 'this is a test'\n";
     *      linux.makePackage("C:\\Temp");
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
     * Shortcut method (also populating the `ExosPkg`) for adding an existing file that should be transferred to the target system
     * 
     * The method doesnt return a file object to be populated, because we expect that the file
     * is already there, or gets created by some other means, like the GenerateDatamodel
     * 
     * 
     * @param {string} fileName name of the file (within the Linux package) that should be transferred to the target system
     * @param {string} changeEvent `Ignore` | `Restart` | `Reinstall` - behaviour of the target component when file is added, removed or changed. 
     * @param {string} description (optional) description that will appear in AS
     */
    addExistingTransferFile(fileName, changeEvent, description) {
        if(description === undefined) {
            description = "";
        }
        //add this file to the exosPackage with a relative path to this package
        this._exosPkg.addFile(path.join(this._folderName,fileName),changeEvent);
        //add it as a "ExistingFile", that the super Package class doesnt consider to write the contents at _createPackage as it does with "Files"
        this._objects.push({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
    }
    
    /**
     * Shortcut method (also populating the `ExosPkg`) for adding a file that can be populated and should be transferred to the target system
     * 
     * Example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux");   
     *      let script = linux.getNewTransferFile("index.js", "Restart", "Main JS script");
     *      script.contents = ..
     *      myPackage.makePackage();
     * 
     * @param {string} fileName name of the file (within the Linux package) that should be transferred to the target system
     * @param {string} changeEvent `Ignore` | `Restart` | `Reinstall` - behaviour of the target component when file is added, removed or changed. 
     * @param {string} description (optional) description that will appear in AS
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    getNewTransferFile(fileName, changeEvent, description) {
        if(description === undefined) {
            description = "";
        }
        //add this file to the exosPackage with a relative path to this package
        this._exosPkg.addFile(path.join(this._folderName,fileName),changeEvent);
        //return a new standard file where the contents can be populated
        return super.getNewFile(fileName,description);
    }

    /**
     * Shortcut method (also populating the `ExosPkg`) for adding an existing .deb file that should be transferred to the target system, and triggers a component reinstallation when changed
     * In the `ExosPkg`, it creates a file for transfer, as well as an `Install` and `Remove` service, that calls the `dpkg` command.
     * The .deb file certainly is assumed to be created externally, and therefore the method doesnt return a file object to be populated.
     * 
     * Example:
     *  
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux");   
     *      linux.addExistingTransferDebFile("exos-comp-mouse_1.0.0.deb", "exos-comp-mouse", "Debian Package");
     *      myPackage.makePackage();
     * 
     * @param {string} fileName name of the Debian package file within the Linux Package, e.g. `exos-comp-mouse_1.0.0.deb`
     * @param {string} packageName name of the Debian package once installed on the system, e.g. `exos-comp-mouse`
     * @param {string} description (optional) description that will appear in AS
     */
    addExistingTransferDebFile(fileName, packageName, description) {
        if(description === undefined) {
            description = "";
        }
        //add this file to the exosPackage with a relative path to this package with the Reinstall attribute
        this._exosPkg.addFile(path.join(this._folderName,fileName),"Reinstall");
        this._exosPkg.addService("Install",`dpkg -i ${fileName}`);
        this._exosPkg.addService("Remove",`dpkg --purge ${packageName}`);
        //add it as a "ExistingFile", that the super Package class doesnt consider to write the contents at _createPackage as it does with "Files"
        this._objects.push({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
    }

    /**
     * Shortcut method(also populating the `ExosPkg`) to create a file that is populated and is added as a build dependency. The file is not (automatically) transferred to the target.
     * Use this function if the complete contents of the file are available, otherwise use the `getNewBuildFile()` that returns a mutable `FileObj`
     * 
     * Example:
     *  
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux");   
     *      linux.addNewFile("build.sh", "echo 'this is a test'\n");
     *      let build = myPackage.exospkg.getNewWSLBuildCommand("Linux","build.sh");
     *      
     *      linux.addNewBuildFile(build, "source.c", getTheSourceCode(), "Source Code");
     *      myPackage.makePackage();
     * 
     * @param {object} buildCommand object returned from `ExosPkg.getNewBuildCommand()` or `ExosPkg.getNewWSLBuildCommand()`
     * @param {string} fileName name of the file within the Linux package
     * @param {string} contents contents of the file that is to be stored on disk
     * @param {string} description (optional) description that will appear in AS
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    addNewBuildFile(buildCommand, fileName, contents, description) {
        if(description === undefined) {
            description = "";
        }
        //add a build dependency to this file
        this._exosPkg.addBuildDependency(buildCommand,path.join(this._folderName,fileName));
        //return a new standard file where the contents can be populated
        super.addNewFile(fileName, contents, description);
    }

    /**
     * Shortcut method(also populating the `ExosPkg`) to create a `FileObj` that can be populated and is added as a build dependency. The file is not (automatically) transferred to the target.
     * If the complete contents of the file are already available, use the simpler `addNewBuildFile()` instead.
     * 
     * Example:
     *  
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux");   
     *      let buildFile = linux.getNewFile("build.sh");
     *      let build = myPackage.exospkg.getNewWSLBuildCommand("Linux","build.sh");
     *      buildFile.contents = "echo 'this is a test'\n";
     *      let sourceFile = linux.getNewBuildFile(build, "source.c", "Source Code");
     *      sourceFile.contents = .. 
     *      myPackage.makePackage();
     * 
     * @param {object} buildCommand object returned from `ExosPkg.getNewBuildCommand()` or `ExosPkg.getNewWSLBuildCommand()`
     * @param {string} fileName name of the file within the Linux package
     * @param {string} description (optional) description that will appear in AS
     * @returns {FileObj} JSON object with a .content property that can be populated with the file contents
     */
    getNewBuildFile(buildCommand, fileName, description) {
        if(description === undefined) {
            description = "";
        }
        //add a build dependency to this file
        this._exosPkg.addBuildDependency(buildCommand,path.join(this._folderName,fileName));
        //return a new standard file where the contents can be populated
        return super.getNewFile(fileName,description);
    }
}

/**
 * Class for IEC Programs that inherits `Package.getNewFile()` and `Package.addExistingFile()`
 * Implicitly generated from the `ExosPackage.getNewIECProgram()`
 * 
 * Example:
 * 
 *      let myPackage = new ExosPackage("MyPackage");
 *      let program = myPackage.getNewIECProgram("Program", "Sample Program");   
 * 
 * Standalone usage:
 * 
 *      let program = new IECProgram("Program");
 */
class IECProgram extends Package {
    constructor(name) {

        super(name);

        this._header  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._header  += `<Program SubType="IEC" xmlns="http://br-automation.co.at/AS/Program">\n`;
        this._header  += `  <Files>\n`;
        
        this._footer += `  </Files>\n`;
        this._footer += `</Program>\n`;

        this._pkgFile = {type:"File", name:"IEC.prg", contents:""};
    }

    /**
     * Create the `IECProgram` in the file system with all its current files.
     * This method is impliclitly called by `ExosPackage.makePackage()`, so it
     * is only in specific cases that this method is used.
     * 
     * Standalone usage:
     * 
     *      let program = new IECProgram("Program");
     *      let programVar = program.getNewFile("Program.var", "Local Variables");
     *      programVar.contents = "VAR\n\nEND_VAR\n";
     *      program.makePackage("C:\\Temp")
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
 * Class for C/C++ Libraries that inherits `Package.getNewFile()` and `Package.addExistingFile()`
 * Implicitly generated from the `ExosPackage.getNewCLibrary()`
 * 
 * Example:
 * 
 *      let myPackage = new ExosPackage("MyPackage");
 *      let library = myPackage.getNewCLibrary("Library", "Sample Library");   
 * 
 * Standalone usage:
 * 
 *      let library = new CLibrary("Library");
 */
class CLibrary extends Package {
    constructor(name) {

        super(name);

        this._header  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header  += `<?AutomationStudio FileVersion="4.10"?>\n`;
        this._header  += `<Library SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Library">\n`;
        this._header  += `  <Files>\n`;
        
        this._footer += `  </Files>\n`;
        this._footer += `  <Dependencies>\n`;
        this._footer += `    <Dependency ObjectName="ExData" />\n`;
        this._footer += `  </Dependencies>\n`;
        this._footer += `</Library>\n`;

        this._pkgFile = {type:"File", name:"ANSIC.lby", contents:""};
    }

    /**
     * Create the `CLibrary` in the file system with all its current files.
     * This method is impliclitly called by `ExosPackage.makePackage()`, so it
     * is only in specific cases that this method is used.
     * 
     * Standalone usage:
     * 
     *      let library = new CLibrary("Library");
     *      let libraryFun = program.getNewFile("Library.fun", "Function blocks and functions");
     *      libraryFun.contents = ..;
     *      library.makePackage("C:\\Temp")
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
 * This is the first goto when creating packages for exOS. The class has a built-in `ExosPkg` and contains generators for `CLibrary` `IECProgram` and `LinuxPackage`,
 * and generates all created objects with one single `makePackage()`. The `ExosPackage` is created with a name, which is the name of the folder 
 * in the filesystem and the implicitly created .exospkg file
 * 
 * It defines the `FileObj` object that is used for populating files
 * 
 * @typedef {Object} FileObj file object that can be manipulated before calling `makePackage()`
 * @property {string} contents contents of the file that is to be stored on disk e.g. "hello world!\n"
 * @property {string} name name of the file stored on disk, eg. "myfile.txt"
 * @property {string} description description of the file inside the AS project
 * 
 *      let myPackage = new ExosPackage("MyPackage");
 *      let sampleFile = myPackage.getNewFile("sample.txt", "Sample File");
 *      sampleFile.contents = "hello world!\n";
 *      ..
 *      myPackage.makePackage("C:\\Temp");
 *
 */
class ExosPackage extends Package {

    constructor(name) {

        super(name);

        this._header += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header += `<?AutomationStudio FileVersion="4.9"?>\n`;
        this._header += `<Package SubType="exosPackage" PackageType="exosPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
        this._header += `  <Objects>\n`;

        this._footer = "";
        this._footer += `  </Objects>\n`;
        this._footer += `</Package>\n`;

        this._exosPkgFile = this.getNewFile(`${name}.exospkg`,"exOS package description");
        this._exosPkg = new ExosPkg();

        this._pkgFile = {type:"File", name:"Package.pkg", contents:""};
    }

    /**
     * Create the `ExosPackage` in the file system with all its current files and packages.
     * 
     * The `ExosPackage` can contain files (inherited from `Package`) as well as further packages, like `CLibrary` `IECProgram` and `LinuxPackage`,
     * and has a built-in `ExosPkg`. When calling this method, all of the contained files and packes are created by calling their respective `makePackage()`.
     * 
     * Example:
     *      
     *      let myPackage = new ExosPackage("MyPackage");
     *        
     *      let sampleFile = myPackage.getNewFile("sample.txt", "Sample File");
     *      sampleFile.contents = "hello world!\n";
     *
     *      let library = myPackage.getNewCLibrary("Library", "Sample Library");
     *      let libraryFile = library.getNewFile("header.h", "Sample Header");
     *      libraryFile.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";
     *      
     *      let program = myPackage.getNewIECProgram("Program", "Sample Program");
     *      let programVar = program.getNewFile("Program.var", "Local Variables");
     *      programVar.contents = "VAR\n\nEND_VAR\n";
     *      programSt = program.getNewFile("Program.st", "Local Variables");
     *      programSt.contents = "PROGRAM _CYCLIC\n\nEND_PROGRAM\n";
     *
     *      //create the "MyPackage" with "sample.txt", 
     *      //the "Library" - with "header.h",
     *      //the "Program" with "Program.var" and "Program.st"
     *      myPackage.makePackage();
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
     * The `ExosPackage` contains a built-in `ExosPkg` which is passed on to all `LinuxPackage`'s that are created.
     * This property accesses the builtin `ExosPkg` object
     * 
     * Example:
     *
     *      let myPackage = new ExosPackage("MyPackage");
     *      myPackage.exospkg.addGenerateDatamodel("Types.typ","Types",[],[]); //add a command to the built-in ExosPkg
     *      let linux = myPackage.getNewLinuxPackage("Linux");   
     *      let script = linux.getNewTransferFile("index.js", "Restart", "Main JS script"); //this also accesses the built-in ExosPkg
     *   
     * @returns {ExosPkg} object
     */
    get exospkg() {
        return this._exosPkg;
    }

    /**
     * Create a new `LinuxPackage` object within the `ExosPackage`.
     *
     * Example:
     *  
     *      let myPackage = new ExosPackage("MyPackage");
     *      let linux = myPackage.getNewLinuxPackage("Linux"); 
     *      linux.addExistingTransferDebFile("exos-comp-mouse_1.0.0.deb", "exos-comp-mouse", "Debian Package");
     *      myPackage.makePackage();
     * 
     * @param {string} name Name of the Linux package (and the folder in the file system)
     * @param {string} description (optional) description that will appear in AS
     * @returns {LinuxPackage} 
     */
    getNewLinuxPackage(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Package", name:name, attributes:"", description:description, _object:new LinuxPackage(this._exosPkg, name)});
        return this._objects.last()._object;
    }

    /**
     * Create a new `CLibrary` object within the `ExosPackage`.
     *
     * Example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *        
     *      let library = myPackage.getNewCLibrary("Library", "Sample Library");
     *      let libraryFile = library.getNewFile("header.h", "Sample Header");
     *      libraryFile.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";
     *      
     *      myPackage.makePackage();     
     *  
     * @param {string} name Name of the C/C++ Library (and the folder in the file system)
     * @param {string} description (optional) description that will appear in AS
     * @returns {CLibrary}
     */
    getNewCLibrary(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Library", name:name, attributes:"Language=\"ANSIC\"", description:description, _object:new CLibrary(name)});

        return this._objects.last()._object;
    }

    /**
     * Create a new `IECProgram` object within the `ExosPackage`.
     * 
     * Example:
     * 
     *      let myPackage = new ExosPackage("MyPackage");
     *        
     *      let program = myPackage.getNewIECProgram("Program", "Sample Program");
     *      let programVar = program.getNewFile("Program.var", "Local Variables");
     *      programVar.contents = "VAR\n\nEND_VAR\n";
     *      programSt = program.getNewFile("Program.st", "Local Variables");
     *      programSt.contents = "PROGRAM _CYCLIC\n\nEND_PROGRAM\n";
     *
     *      myPackage.makePackage();
     * 
     * @param {string} name Name of the IEC Program (and the folder in the file system) 
     * @param {string} description (optional) description that will appear in AS
     * @returns {IECProgram}
     */
    getNewIECProgram(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Program", name:name, attributes:"Language=\"IEC\"", description:description, _object:new IECProgram(name)});

        return this._objects.last()._object;
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

module.exports = {ExosPackage};