const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponent } = require('./exoscomponent');
const { TemplateLinuxCpp } = require('./templates/linux/template_linux_cpp');
const { TemplateARCpp } = require('./templates/ar/template_ar_cpp');

const path = require('path');

/**
 * @typedef {Object} ExosComponentCppOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * 
 */

class ExosComponentCpp extends ExosComponent{

    /**
     * Options for manipulating the output of the `ExosComponentCTemplate` class in the `makeComponent` method
     * 
     * @type {ExosComponentCppOptions}
     */
    options;

    constructor(fileName, typeName) {
        super(fileName, typeName);

        this._templateCppAR = new TemplateARCpp(this._datamodel);
        this._templateCppLinux = new TemplateLinuxCpp(this._datamodel);

        this._templateBuild = new TemplateLinuxBuild(typeName);
        this.options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`}

    }

    makeComponent(location) {
        
        /* AR */
        this._cLibrary.addNewFileObj(this._templateCppAR.libraryFun);
        this._cLibrary.addNewFileObj(this._templateCppAR.librarySource);
        this._cLibrary.addNewFileObj(this._templateCppAR.datasetHeader);
        this._cLibrary.addNewFileObj(this._templateCppAR.datamodelHeader);
        this._cLibrary.addNewFileObj(this._templateCppAR.datamodelSource);
        this._cLibrary.addNewFileObj(this._templateCppAR.loggerHeader);
        this._cLibrary.addNewFileObj(this._templateCppAR.loggerSource);

        this._iecProgram.addNewFileObj(this._templateCppAR.iecProgramVar);
        this._iecProgram.addNewFileObj(this._templateCppAR.iecProgramST);

        /* Linux */
        let linuxBuild = this._exospackage.exospkg.getNewWSLBuildCommand("Linux", this._templateBuild.buildScript.name);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.mainSource);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.termination.terminationHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.termination.terminationSource);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.datasetHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.datamodelHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.datamodelSource);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.loggerHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateCppLinux.loggerSource);

        this._templateBuild.options.executable.enable = true;

        this._templateBuild.options.executable.staticLibrary.enable = true;
        this._templateBuild.options.executable.staticLibrary.sourceFiles = [this._templateCppLinux.datasetHeader.name,
                                                                            this._templateCppLinux.datamodelHeader.name,
                                                                            this._templateCppLinux.datamodelSource.name,
                                                                            this._templateCppLinux.loggerHeader.name,
                                                                            this._templateCppLinux.loggerSource.name];

        this._templateBuild.options.executable.sourceFiles = [this._templateCppLinux.termination.terminationSource.name, this._templateCppLinux.mainSource.name]
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this.options.destinationDirectory;
        
        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.buildScript);
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);

        /* Additional exospkg settings */

        this._exospackage.exospkg.addService("Runtime", `./${this._templateBuild.options.executable.executableName}`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateCppAR.template.datamodelInstanceName}`);

        super.makeComponent(location);
    }
}


if (require.main === module) {

    process.stdout.write(`exOS C++ Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentCpp(fileName, structName);
        let outDir = path.join(__dirname,path.dirname(fileName));

        process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);
        
        template.makeComponent(outDir);     
    }
    else {
        process.stderr.write("usage: ./exoscomponent_c_template.js <filename.typ> <structname>\n");
    }
}

module.exports = {ExosComponentCpp};