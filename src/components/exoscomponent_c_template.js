const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateLinuxC } = require('./templates/linux/template_linux_c');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponent } = require('./exoscomponent');
const path = require('path');

/**
 * @typedef {Object} ExosComponentCTemplateOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user` + `typeName`
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
        this._templateBuild = new TemplateLinuxBuild(typeName);
        this.options = {destinationDirectory: `/home/user/${typeName}`}
    }

    makeComponent(location) {

        this._templateBuild.options.executable.enable = true;
        this._templateBuild.options.executable.sourceFiles = ["termination.c", `${this._typeName.toLowerCase()}.c`]
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this.options.destinationDirectory;

        this._cLibrary.addNewFile(`${this._typeName}.fun`, this._templateAR.generateFun());
        this._cLibrary.addNewFile(`${this._typeName.toLowerCase()}.c`, this._templateAR.generateSource());

        this._iecProgram.addNewFile(`${this._typeName}.var`,this._templateAR.generateIECProgramVar());
        this._iecProgram.addNewFile(`${this._typeName}.st`, this._templateAR.generateIECProgramST());
        
        this._linuxPackage.addNewBuildFile(this._linuxBuild,"CMakeLists.txt",this._templateBuild.generateCMakeLists());
        this._linuxPackage.addNewBuildFile(this._linuxBuild,"build.sh",this._templateBuild.generateShBuild());
        this._linuxPackage.addNewBuildFile(this._linuxBuild,`${this._typeName.toLowerCase()}.c`,this._templateLinux.generateSource());
        this._linuxPackage.addNewBuildFile(this._linuxBuild,"termination.h",this._templateLinux.generateTerminationHeader());
        this._linuxPackage.addNewBuildFile(this._linuxBuild,"termination.c",this._templateLinux.generateTerminationSource());
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName,this._templateBuild.options.debPackage.packageName);
        this._exospackage.exospkg.addService("Runtime", `./${this._templateBuild.options.executable.executableName}`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._typeName}_0`);

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
        
        template.makeComponent(outDir);     
    }
    else {
        process.stderr.write("usage: ./exoscomponent_c_template.js <filename.typ> <structname>\n");
    }
}

module.exports = {ExosComponentCTemplate};