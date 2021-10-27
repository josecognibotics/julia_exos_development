const path = require('path');
const fs = require('fs');

//shortcut to get an arrays last (pushed) element
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

/**
 * Base class for Packages, not used directly
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
     * Create a new file in this package and return a object for populating its contents
     * 
     * For example:
     * package = new ExosPackage("mypackage");
     * packageFile = package.getNewFile("myfile.txt", "test file");
     * packageFile.contents = "hello world!\n";
     * package.makePackage("C:\\Temp");
     * 
     * @param {string} fileName filename within this package
     * @param {string} description description that will appear in AS
     * @returns JSON object with a .content property that can be populated with the file contents
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
     * @param {string} description description that will appear in AS
     */
    addExistingFile(fileName, description) {
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
 * Class for the .exospkg file, created within an ExosPackage and accessed via `getExosPkg()`
 * It contains metods to populate the contents of an .exospkg, and returns the XML contents
 * via `getContents()` - whereas this function is called implicitly by the ExosPackage `makePackage()`
 * 
 * For example:
 * 
 *      package = new ExosPackage("mypackage");
 *      package.getExosPkg().addService("Runtime","/home/user/myexecutable");
 *      package.makePackage("C:\\Temp");
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
     * @param {string} changeEvent `Ignore` | `Restart` | `Reinstall`
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
     * See `addOutputPath()` and `addSG4Include()`
     * 
     * The GenerateDatamodel functionality creates two files, `exos_{typeName}.c` and `exos_{typeName}.c`
     * These files need to be added as addExistingFile() to the packages defined as OutputPaths
     *      
     *      mypackage = new ExosPackage("mypackage");
     *      linux = mypackage.getNewLinuxPackage("Linux")    
     *      linux.addExistingFile("exos_types.h"); //created by GenerateDatamodel
     *      linux.addExistingFile("exos_types.c"); //created by GenerateDatamodel
     *      generator = mypackage.getExosPkg().getNewGenerateDatamodel("Types.typ","Types");
     *      mypackage.getExosPkg().addOutputPath(generator,"Linux"); //generate files in the "Linux" package
     * 
     * @param {string} fileName Name of the IEC .typ file that contains the datatype
     * @param {string} typeName Name of the datatype withing the .typ file
     * @returns object that should be populated with output paths and can be further populated with _SG4 include directives
     */
    getNewGenerateDatamodel(fileName, typeName) {
        this._generateDatamodels.push({fileName:fileName,typeName:typeName,SG4Includes:[],OutputPaths:[]});
        return this._generateDatamodels.last();
    }

    /**
     * Add a specific SG4 include to include the datatype generated from the IEC .typ file in AS
     * In most cases, exos components are created from IEC .typ files which also exist in AS and that generate a C-declaration
     * of this type which can be included in C-programs. For example, if the .typ file is within "Types", then "Types.h"
     * should be added as SG4 include, that the C-Program can utilize the library functions without clashing with the generated
     * C-datatypes in the generated c/h datamodel files.
     * 
     * For example:
     * 
     *      mypackage = new ExosPackage("mypackage");
     *      generator = mypackage.getExosPkg().getNewGenerateDatamodel("Types.typ","Types");
     *      mypackage.getExosPkg().addSG4Include(generator,"Types.h"); //include the Types Library in AS
     * 
     * @param {object} generateDataModel object returned from `getNewGenerateDatamodel()`
     * @param {string} SG4Include Name for the headerfile that should be used specifically for _SG4, e.g. "myheader.h"
     */
    addSG4Include(generateDataModel, SG4Include)
    {
        generateDataModel.SG4Includes.push(SG4Include);
    }

    /**
     * The GenerateDatamodel function needs an outputPath to know where genereate the datamodel files.
     * the addOutputPath can be used to provide several output paths
     * 
     * For example:
     *      
     *      mypackage = new ExosPackage("mypackage");
     *      library = mypackage.getNewCLibrary("Types", "My First library");
     *      library.addExistingFile("exos_types.h"); //created by GenerateDatamodel
     *      library.addExistingFile("exos_types.c"); //created by GenerateDatamodel
     *      linux = mypackage.getNewLinuxPackage("Linux")    
     *      linux.addExistingFile("exos_types.h"); //created by GenerateDatamodel
     *      linux.addExistingFile("exos_types.c"); //created by GenerateDatamodel
     *      generator = mypackage.getExosPkg().getNewGenerateDatamodel("Types.typ","Types");
     *      mypackage.getExosPkg().addOutputPath(generator,"Types"); //generate files in the "Types" library
     *      mypackage.getExosPkg().addOutputPath(generator,"Linux"); //generate files in the "Linux" package
     * 
     * 
     * @param {object} generateDataModel object returned from `getNewGenerateDatamodel()`
     * @param {string} outputPath Destination path of the generated c/h datamodel files, relative to the .exospkg file
     */
    addOutputPath(generateDataModel, outputPath)
    {
        generateDataModel.OutputPaths.push(outputPath);
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
     * @returns object that can be further populated with file dependencies using `addBuildDependency()`
     */
    getNewBuildCommand(command, workingDirectory, args) {
        this._buildCommands.push({command:command, workingDirectory:workingDirectory, args:args, Dependencies:[]});
        return this._buildCommands.last();
    }

    /**
     * 
     * @returns 
     */
    getNewWSLBuildCommand() {
        return this.getNewBuildCommand("C:\\Windows\\Sysnative\\wsl.exe","Linux","-d Debian -e sh build.sh");
    }

    /**
     * 
     * @param {object} buildCommand object returned from `getNewBuildCommand()` or `getNewWSLBuildCommand()`
     * @param {string} fileName filename including the path relative to the .exospkg that should be added as build dependency
     */
    addBuildDependency(buildCommand, fileName) {
        buildCommand.Dependencies.push(fileName);
    }

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
            out += `    <Service Type="${service.type} Command="${service.command}"`;
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
                for(const SG4Include of generateDataModel.SG4Includes) {
                    out += `            <SG4 Include="${SG4Include}"/>\n`;
                }
                for(const outputPath of generateDataModel.OutputPaths) {
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

class LinuxPackage extends Package {
    constructor(name, exosPkg) {

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

    makePackage(location) {
        //fill the package specific contents
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            //we only write "File" for the objects, because some _objects have special type properties (like "ExistingFile")
            this._pkgFile.contents += `    <Object Type="File" Description="${obj.description}">${obj.name}</Object>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);
    }


    addExistingTransferFile(fileName, changeEvent, description) {
        //add this file to the exosPackage with a relative path to this package
        this._exosPkg.addFile(path.join(this._folderName,fileName),changeEvent);
        //add it as a "ExistingFile", that the super Package class doesnt consider to write the contents at _createPackage as it does with "Files"
        this._objects.push({type:"ExistingFile", name:fileName, attributes:"", description:description, contents:""});
    }
    
    getNewTransferFile(fileName, changeEvent, description) {
        //add this file to the exosPackage with a relative path to this package
        this._exosPkg.addFile(path.join(this._folderName,fileName),changeEvent);
        //return a new standard file where the contents can be populated
        return super.getNewFile(fileName,description);
    }

    addExistingTransferDebFile(fileName, packageName, description) {
        //add this file to the exosPackage with a relative path to this package with the Reinstall attribute
        this._exosPkg.addFile(path.join(this._folderName,name),"Reinstall");
        this._exosPkg.addService("Install",`dpkg -i ${fileName}`);
        this._exosPkg.addService("Remove",`dpkg --purge ${packageName}`);
        //add it as a "ExistingFile", that the super Package class doesnt consider to write the contents at _createPackage as it does with "Files"
        this._objects.push({type:"ExistingFile", name:name, attributes:"", description:description, contents:""});
    }

    getNewBuildFile(buildCommand, name, description) {
        //add a build dependency to this file
        this._exosPkg.addBuildDependency(buildCommand,path.join(this._folderName,name));
        //return a new standard file where the contents can be populated
        return super.getNewFile(name,description);
    }
}

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

    makePackage(location) {
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <File Description="${obj.description}">${obj.name}</File>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);
    }
}


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

    makePackage(location) {
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <File Description="${obj.description}">${obj.name}</File>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);
    }
}



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

    getExosPkg() {
        return this._exosPkg;
    }

    getNewLinuxPackage(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Package", name:name, attributes:"", description:description, _object:new LinuxPackage(name, this._exosPkg)});
        return this._objects.last()._object;
    }

    getNewCLibrary(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Library", name:name, attributes:"Language=\"ANSIC\"", description:description, _object:new CLibrary(name)});

        return this._objects.last()._object;
    }

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

        exospkg = new ExosPackage(packageName);
        wslBuild = exospkg.getExosPkg().getNewWSLBuildCommand();
        
        sampleFile = exospkg.getNewFile("sample.txt", "Sample File");
        sampleFile.contents = "hello world!\n";

        library = exospkg.getNewCLibrary("Library", "Sample Library");
        libraryFile = library.getNewFile("header.h", "Sample Header");
        libraryFile.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";
        
        program = exospkg.getNewIECProgram("Program", "Sample Program");
        programVar = program.getNewFile("Program.var", "Local Variables");
        programVar.contents = "VAR\n\nEND_VAR\n";
        programSt = program.getNewFile("Program.st", "Local Variables");
        programSt.contents = "PROGRAM _CYCLIC\n\nEND_PROGRAM\n";
        
        linux = exospkg.getNewLinuxPackage("Linux", "");

        linuxHeader = linux.getNewBuildFile(wslBuild,"header.h", "Sample Header");
        linuxHeader.contents = "#ifndef _HEADER_H_\n#define _HEADER_H_\n\n#endif //_HEADER_H_\n";

        exospkg.makePackage(path.join(__dirname, folder));
    }
    else {
        process.stderr.write("usage: ./ExosPackage.js <folder> <packagename>\n");
    }
}

module.exports = {Package};