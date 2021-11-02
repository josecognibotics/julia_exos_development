const { ExosComponent } = require('./exoscomponent');
const { TemplateARStaticCLib } = require('./templates/ar/template_ar_static_c_lib');
const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { TemplateLinuxSWIG } = require('./templates/linux/template_linux_swig');

const path = require('path');

/**
 * @typedef {Object} ExosComponentSWIGOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * @property {boolean} generateARStaticLib if `true`, the AR side will be generated using the static library wrapper, which has less overhead and is easier to program / change, but only allows one instance in AR. If false, the library main function will use the exos_api commands directly
 * 
 */

class ExosComponentSWIG extends ExosComponent {

    /**
     * Options for manipulating the output of the `ExosComponentSWIG` class in the `makeComponent` method
     * 
     * @type {ExosComponentSWIGOptions}
     */
    options;

    constructor(fileName, typeName) {
        super(fileName, typeName);

        this._templateAR = new TemplateARDynamic(this._datamodel);
        this._templateARStatic = new TemplateARStaticCLib(this._datamodel);
        this._templateBuild = new TemplateLinuxBuild(typeName);
        this._templateSWIG = new TemplateLinuxSWIG(this._datamodel);

        this.options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`, generateARStaticLib:true}

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
       
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateSWIG.staticLibraryHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateSWIG.staticLibrarySource);
        
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateSWIG.swigInclude);
        
        this._templateBuild.options.swigPython.enable = true;
        this._templateBuild.options.swigPython.sourceFiles = [this._templateSWIG.staticLibrarySource.name, this._templateSWIG.swigInclude.name];
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this.options.destinationDirectory;
        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.buildScript);
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);
        this._linuxPackage.addNewTransferFileObj(this._templateSWIG.pythonMain,"Restart");
        this._exospackage.exospkg.addService("Startup", `cp ${this._templateSWIG.pythonMain.name} this._templateBuild.options.debPackage.destination`);
        this._exospackage.exospkg.addService("Runtime", `./${this._templateBuild.options.executable.executableName}`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateAR.template.datamodelInstanceName}`);

        super.makeComponent(location);
    }
}

if (require.main === module) {

    process.stdout.write(`exOS Python Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentSWIG(fileName, structName);
        let outDir = path.join(__dirname,path.dirname(fileName));

        process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);
        
        template.makeComponent(outDir);     
    }
    else {
        process.stderr.write("usage: ./exoscomponent_c_template.js <filename.typ> <structname>\n");
    }
}

module.exports = {ExosComponentSWIG}