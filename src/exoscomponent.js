const { ExosPackage } = require('./exospackage');
const path = require('path')

class Component {

    constructor(typeName) {
        this.exospackage = new ExosPackage(typeName);
    }

    makeComponent(location)
    {
        this.exospackage.makePackage(location);
    }
}

class ExosComponent extends Component {

    /**
     * 
     * @param {string} typeName 
     * @param {string} buildScript 
     */
    constructor(typeName, buildScript) {

        super(typeName, [`${typeName.toLowerCase()}.h`]);

        this.cLibrary = this.exospackage.getNewCLibrary(typeName, ``);
        this.cLibrary.addExistingFile(`exos_${typeName}.h`,``);
        this.cLibrary.addExistingFile(`exos_${typeName}.c`,``);

        this.iecProgram = this.exospackage.getNewIECProgram(`${typeName}_0`,``);

        this.linuxPackage = this.exospackage.getNewLinuxPackage("Linux");
        this.linuxPackage.addExistingFile(`exos_${typeName}.h`,``);
        this.linuxPackage.addExistingFile(`exos_${typeName}.c`,``);
        
        this.exospackage.exospkg.addGenerateDatamodel(`${typeName}/${typeName}.typ`, typeName, [`${typeName}.h`], [typeName, "Linux"]);
        this.linuxBuild = this.exospackage.exospkg.getNewWSLBuildCommand("Linux", buildScript);
    }
}


module.exports = {ExosComponent};