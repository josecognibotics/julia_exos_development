const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateARStaticCLib } = require('./templates/ar/template_ar_static_c_lib');
const { TemplateLinuxC } = require('./templates/linux/template_linux_c');
const { TemplateLinuxStaticCLib } = require('./templates/linux/template_linux_static_c_lib');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponent } = require('./exoscomponent');
const path = require('path');

/**
 * @typedef {Object} ExosComponentCOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * @property {boolean} generateARStaticLib if `true`, the AR side will be generated using the static library wrapper, which has less overhead and is easier to program / change, but only allows one instance in AR. If false, the library main function will use the exos_api commands directly
 * @property {boolean} generateLinuxStaticLib if `true`, the linux application will use the static library wrapper, which has less overhead and easier to program / change. If `false`, the `exos_api` interfece is used directly in the main code.
 * 
 */
class ExosComponentC extends ExosComponent {

    /**
     * Options for manipulating the output of the `ExosComponentC` class in the `makeComponent` method
     * 
     * @type {ExosComponentCOptions}
     */
    options;

    /**
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     */
    constructor(fileName, typeName) {
        super(fileName, typeName);
        
        this._templateAR = new TemplateARDynamic(this._datamodel);
        this._templateLinux = new TemplateLinuxC(this._datamodel);
        this._templateARStatic = new TemplateARStaticCLib(this._datamodel);
        this._templateLinuxStatic = new TemplateLinuxStaticCLib(this._datamodel);
        this._templateBuild = new TemplateLinuxBuild(typeName);
        this.options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`, generateARStaticLib:false, generateLinuxStaticLib:false}
    }

    makeComponent(location) {

        /* AR */

        let templateAR = this._templateAR;
        if(this.options.generateARStaticLib) {
            templateAR = this._templateARStatic;
            this._cLibrary.addNewFileObj(this._templateARStatic.staticLibraryHeader);
            this._cLibrary.addNewFileObj(this._templateARStatic.staticLibrarySource);
        }

        this._cLibrary.addNewFileObj(templateAR.libraryFun);
        this._cLibrary.addNewFileObj(templateAR.librarySource);
        this._cLibrary.addNewFileObj(templateAR.heap.heapSource);
        
        this._iecProgram.addNewFileObj(templateAR.iecProgramVar);
        this._iecProgram.addNewFileObj(templateAR.iecProgramST);
        
        /* Linux */

        let linuxBuild = this._exospackage.exospkg.getNewWSLBuildCommand("Linux", this._templateBuild.buildScript.name);

        let templateLinux = this._templateLinux;
        if(this.options.generateLinuxStaticLib) {
            templateLinux = this._templateLinuxStatic;
            this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinuxStatic.staticLibraryHeader);
            this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinuxStatic.staticLibrarySource);
        }
        this._linuxPackage.addNewBuildFileObj(linuxBuild, templateLinux.mainSource);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, templateLinux.termination.terminationHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, templateLinux.termination.terminationSource);

        this._templateBuild.options.executable.enable = true;

        if(this.options.generateLinuxStaticLib) {
            this._templateBuild.options.executable.staticLibrary.enable = true;
            this._templateBuild.options.executable.staticLibrary.sourceFiles = [this._templateLinuxStatic.staticLibrarySource.name]
        }
        this._templateBuild.options.executable.sourceFiles = [templateLinux.termination.terminationSource.name, templateLinux.mainSource.name]
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this.options.destinationDirectory;

        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.buildScript);
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);

        /* Additional exospkg settings */

        this._exospackage.exospkg.addService("Runtime", `./${this._templateBuild.options.executable.executableName}`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateAR.template.datamodelInstanceName}`);

        super.makeComponent(location);
    }
}

if (require.main === module) {

    process.stdout.write(`exOS C Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentC(fileName, structName);
        let outDir = path.join(__dirname,path.dirname(fileName));

        process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);
        template.options.generateLinuxStaticLib = true;
        template.options.generateARStaticLib = true;
        
        template.makeComponent(outDir);     
    }
    else {
        process.stderr.write("usage: ./exoscomponent_c_template.js <filename.typ> <structname>\n");
    }
}

module.exports = {ExosComponentC};