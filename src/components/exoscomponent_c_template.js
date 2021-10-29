const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateLinuxC } = require('./templates/linux/template_linux_c');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponent } = require('./exoscomponent');
const path = require('path');

/**
 * @typedef {Object} ExosComponentCTemplateOptions
 * @property {string} destinationDirectory destination 
 */
class ExosComponentCTemplate extends ExosComponent {

    /**
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     */
    constructor(fileName, typeName) {
        super(fileName, typeName, "build.sh");

        this.templateAR = new TemplateARDynamic(this.datamodel);
        this.templateLinux = new TemplateLinuxC(this.datamodel);
        this.templateBuild = new TemplateLinuxBuild(typeName);
    }

    makeComponent(location) {

        this.templateBuild.options.executable.enable = true;
        this.templateBuild.options.executable.sourceFiles = ["termination.c", `${this.typeName.toLowerCase()}.c`]
        this.templateBuild.options.debPackage.enable = true;

        this.cLibrary.addNewFile(`${this.typeName}.fun`, this.templateAR.generateFun());
        this.cLibrary.addNewFile(`${this.typeName.toLowerCase()}.c`, this.templateAR.generateSource());

        this.iecProgram.addNewFile(`${this.typeName}.var`,this.templateAR.generateIECProgramVar());
        this.iecProgram.addNewFile(`${this.typeName}.st`, this.templateAR.generateIECProgramST());
        
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"CMakeLists.txt",this.templateBuild.generateCMakeLists());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"build.sh",this.templateBuild.generateShBuild());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,`${this.typeName.toLowerCase()}.c`,this.templateLinux.generateSource());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"termination.h",this.templateLinux.generateTerminationHeader());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"termination.c",this.templateLinux.generateTerminationSource());
        this.linuxPackage.addExistingTransferDebFile(this.templateBuild.options.debPackage.fileName,this.templateBuild.options.debPackage.packageName);
        this.exospackage.exospkg.addService("Runtime", `./${this.templateBuild.options.executable.executableName}`, this.templateBuild.options.debPackage.destination);

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