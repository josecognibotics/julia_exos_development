const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateARStaticCLib } = require('./templates/ar/template_ar_static_c_lib');
const { TemplateLinuxC } = require('./templates/linux/template_linux_c');
const { TemplateLinuxStaticCLib } = require('./templates/linux/template_linux_static_c_lib');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponent } = require('./exoscomponent');
const path = require('path');

/**
 * @typedef {Object} ExosComponentCTemplateOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user` + `typeName`
 * @property {boolean} generateARStaticLib if `true`, the AR side will be generated using the static library wrapper, which has less overhead and is easier to program / change, but only allows one instance in AR. If false, the library main function will use the exos_api commands directly
 * @property {boolean} generateLinuxStaticLib if `true`, the linux application will use the static library wrapper, which has less overhead and easier to program / change. If `false`, the `exos_api` interfece is used directly in the main code.
 * 
 */
class ExosComponentCTemplate extends ExosComponent {

    /**
     * Options for manipulating the output of the `ExosComponentCTemplate` class in the `makeComponent` method
     * 
     * @type {ExosComponentCTemplateOptions}
     */
    options;

    /**
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     */
    constructor(fileName, typeName) {
        super(fileName, typeName, "build.sh");
        
        this._templateAR = new TemplateARDynamic(this._datamodel);
        this._templateLinux = new TemplateLinuxC(this._datamodel);
        this._templateARStatic = new TemplateARStaticCLib(this._datamodel);
        this._templateLinuxStatic = new TemplateLinuxStaticCLib(this._datamodel);
        this._templateBuild = new TemplateLinuxBuild(typeName);
        this.options = {destinationDirectory: `/home/user/${typeName}`}
    }

    makeComponent(location) {

        this._templateBuild.options.executable.enable = true;

        if(this.options.generateLinuxStaticLib) {
            this._templateBuild.options.executable.staticLibrary.enable = true;
            this._templateBuild.options.executable.staticLibrary.sourceFiles = [`lib${this._typeName.toLowerCase()}.c`]
        }
        this._templateBuild.options.executable.sourceFiles = ["termination.c", `${this._typeName.toLowerCase()}.c`]
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this.options.destinationDirectory;

        this._linuxPackage.addNewBuildFile(this._linuxBuild,"CMakeLists.txt",this._templateBuild.generateCMakeLists());
        this._linuxPackage.addNewBuildFile(this._linuxBuild,"build.sh",this._templateBuild.generateShBuild());
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName);
        this._exospackage.exospkg.addService("Runtime", `./${this._templateBuild.options.executable.executableName}`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateAR.template.datamodelInstanceName}`);

        let templateAR = this._templateAR;
        if(this.options.generateARStaticLib) {
            templateAR = this._templateARStatic;
            this._cLibrary.addNewFile(`lib${this._typeName.toLowerCase()}.h`, templateAR.generateLibSource());
            this._cLibrary.addNewFile(`lib${this._typeName.toLowerCase()}.c`, templateAR.generateLibHeader());
        }

        this._cLibrary.addNewFileObj(templateAR.libraryFun);
        this._cLibrary.addNewFileObj(templateAR.librarySource);
        this._iecProgram.addNewFileObj(templateAR.iecProgramVar);
        this._iecProgram.addNewFileObj(templateAR.iecProgramST);
        
        let templateLinux = this._templateLinux;
        if(this.options.generateLinuxStaticLib) {
            templateLinux = this._templateLinuxStatic;
            this._linuxPackage.addNewBuildFile(this._linuxBuild, `lib${this._typeName.toLowerCase()}.h`, templateLinux.generateLibHeader());
            this._linuxPackage.addNewBuildFile(this._linuxBuild, `lib${this._typeName.toLowerCase()}.c`, templateLinux.generateLibSource());
        }
        this._linuxPackage.addNewBuildFile(this._linuxBuild,`${this._typeName.toLowerCase()}.c`, templateLinux.generateSource());
        this._linuxPackage.addNewBuildFile(this._linuxBuild,"termination.h", templateLinux.generateTerminationHeader());
        this._linuxPackage.addNewBuildFile(this._linuxBuild,"termination.c", templateLinux.generateTerminationSource());

        super.makeComponent(location);
    }
}

if (require.main === module) {

    process.stdout.write(`exOS C Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentCTemplate(fileName, structName);
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

module.exports = {ExosComponentCTemplate};