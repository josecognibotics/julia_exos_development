const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateLinuxC } = require('./templates/linux/template_linux_c');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponent } = require('./exoscomponent');
const path = require('path');

class ExosComponentCTemplate extends ExosComponent {

    /**
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     */
    constructor(fileName, typeName) {
        super(typeName, "build.sh");

        let templateAR = new TemplateARDynamic(fileName, typeName);
        let templateLinux = new TemplateLinuxC(fileName, typeName);
        let templateBuild = new TemplateLinuxBuild(typeName);

        templateBuild.options.executable.enable = true;
        templateBuild.options.executable.sourceFiles = ["termination.c", `${typeName.toLowerCase()}.c`]
        templateBuild.options.debPackage.enable = true;

        this.cLibrary.addNewFile(`${typeName}.fun`, templateAR.generateFun());
        this.cLibrary.addNewFile(`${typeName.toLowerCase()}.c`, templateAR.generateSource());

        this.iecProgram.addNewFile(`${typeName}.var`,templateAR.generateIECProgramVar());
        this.iecProgram.addNewFile(`${typeName}.st`, templateAR.generateIECProgramST());
        
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"CMakeLists.txt",templateBuild.generateCMakeLists());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"build.sh",templateBuild.generateShBuild());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,`${typeName.toLowerCase()}.c`,templateLinux.generateSource());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"termination.h",templateLinux.generateTerminationHeader());
        this.linuxPackage.addNewBuildFile(this.linuxBuild,"termination.c",templateLinux.generateTerminationSource());
        this.linuxPackage.addExistingTransferDebFile(templateBuild.options.debPackage.fileName,templateBuild.options.debPackage.packageName);
        this.exospackage.exospkg.addService("Runtime", `./${templateBuild.options.executable.executableName}`, templateBuild.options.debPackage.destination);
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