const { ExosPackage } = require('../exospackage');
const { Datamodel } = require('../datamodel');

const path = require('path')

class Component {

    /**name of the `ExosPackage` */
    name;

    /**`ExosPackage` created with the name `{name}` */
    exospackage;

    constructor(name) {
        this.name = name;
        this.exospackage = new ExosPackage(name);
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

    /**name of the IEC datatype used to generate the datamodel, `name` is also set to this `typeName`*/
    typeName;

    /**name of the .typ source file for generating the datamodel */
    fileName;

    /**generated datamodel using `typeName` and `{typeName}.h` as SGInclude */
    datamodel;

    /**filenames of the generated datamodel files*/
    datamodelFiles;

    /**object returned from `exospkg.getNewWSLBuildCommand()` in order to add files as build dependencies*/
    linuxBuild;

    /**`LinuxPackage` created in the folder "Linux". contains generated headerfiles*/
    linuxPackage;

    /**`CLibrary` for AR created in the folder `{typeName}`. contains generated headerfiles*/
    cLibrary;

    /**`IECProgram` for AR created in the folder `{typeName}_0`. does not contain any files*/
    iecProgram;

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
        this.exospackage.exospkg.addGenerateDatamodel(`${typeName}/${typeName}.typ`, typeName, [`${typeName}.h`], [typeName, "Linux"]);
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