const { ExosPackage } = require('../exospackage');
const { Datamodel } = require('../datamodel');

const path = require('path')

class Component {

    constructor(typeName) {
        this.typeName = typeName;
        this.exospackage = new ExosPackage(typeName);
    }

    makeComponent(location)
    {
        this.exospackage.makePackage(location);
    }
}

/**
 * Base class for (most) ExosComponent Templates
 * 
 */
class ExosComponent extends Component {

    /**
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     * @param {string} buildScript 
     */
    constructor(fileName, typeName, buildScript) {

        super(typeName);

        this.fileName = fileName;

        this.datamodel = new Datamodel(fileName, typeName, [`${typeName}.h`])
        this.datamodelFiles = this.exospackage.exospkg.getNewGenerateDatamodel(`${typeName}/${typeName}.typ`, typeName, [`${typeName}.h`], [typeName, "Linux"]);
        this.linuxBuild = this.exospackage.exospkg.getNewWSLBuildCommand("Linux", buildScript);

        this.linuxPackage = this.exospackage.getNewLinuxPackage("Linux");
        this.linuxPackage.addNewFile(this.datamodelFiles.headerFileName,this.datamodel.headerFileCode);
        this.linuxPackage.addNewFile(this.datamodelFiles.sourceFileName, this.datamodel.sourceFileCode);

        this.cLibrary = this.exospackage.getNewCLibrary(typeName, ``);
        this.cLibrary.addNewFile(this.datamodelFiles.headerFileName,this.datamodel.headerFileCode);
        this.cLibrary.addNewFile(this.datamodelFiles.sourceFileName, this.datamodel.sourceFileCode);

        this.iecProgram = this.exospackage.getNewIECProgram(`${typeName}_0`,``);
    }

    makeComponent(location)
    {
        super.makeComponent(location);
    }
}


module.exports = {ExosComponent};