const { Template } = require('./template');
const { ExosPackage } = require('./exospackage');
const path = require('path')

class BaseComponent {

    constructor(fileName, typeName, SG4Includes) {
        this.template = new Template(fileName, typeName, SG4Includes);
        this.exospackage = new ExosPackage(typeName);
    }

    makeComponent(location)
    {
        this.exospackage.makePackage(location);
    }
}

class ExosBaseComponent extends BaseComponent {

    constructor(fileName, typeName, SG4Includes, buildScript) {

        super(fileName, typeName, SG4Includes);

        this.cLibrary = this.exospackage.getNewCLibrary(typeName, ``);
        this.cLibrary.addExistingFile(`exos_${typeName}.h`,``);
        this.cLibrary.addExistingFile(`exos_${typeName}.c`,``);

        this.iecProgram = this.exospackage.getNewIECProgram(`${typeName}_0`,``);

        this.linuxPackage = this.exospackage.getNewLinuxPackage("Linux");
        this.linuxPackage.addExistingFile(`exos_${typeName}.h`,``);
        this.linuxPackage.addExistingFile(`exos_${typeName}.c`,``);
        
        this.exospackage.exospkg.getNewGenerateDatamodel(`${typeName}/${path.basename(fileName)}`, typeName, SG4Includes, [typeName, "Linux"]);
        this.linuxBuild = this.exospackage.exospkg.getNewWSLBuildCommand("Linux", buildScript);
    }
}


module.exports = {ExosBaseComponent};