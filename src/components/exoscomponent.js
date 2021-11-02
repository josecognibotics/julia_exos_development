const { ExosPackage, IECProgram, LinuxPackage, CLibrary} = require('../exospackage');
const { Datamodel } = require('../datamodel');

const path = require('path')

class Component {

    /**name of the {@link ExosPackage} 
     * @type {string}
    */
    _name;

    /**{@link ExosPackage} created with the name `{name}` 
     * @type {ExosPackage}
    */
    _exospackage;

    constructor(name) {
        this._name = name;
        this._exospackage = new ExosPackage(name);
    }

    makeComponent(location)
    {
        this._exospackage.makePackage(location);
    }
}

/**
 * Base class for (most) ExosComponent Templates
 * 
 */
class ExosComponent extends Component {

    /**name of the IEC datatype used to generate the datamodel, {@link _name} is also set to this {@link _typeName}
     * @type {string}
    */
    _typeName;

    /**name of the .typ source file for generating the datamodel 
     * @type {string}
    */
    _fileName;

    /**generated datamodel using {@link _typeName} and `{typeName}.h` as SGInclude 
     * @type {Datamodel}
    */
    _datamodel;

    /**{@link LinuxPackage} created in the folder `Linux`. by default, the package only contains generated headerfiles
     * @type {LinuxPackage}
    */
    _linuxPackage;

    /**{@link CLibrary} for AR created in the folder `{typeName}`. by default, the package only contains generated headerfiles
     * @type {CLibrary}
    */
    _cLibrary;

    /**{@link IECProgram} for AR created in the folder `{typeName}_0`. by default, the package does not contain any files
     * @type {IECProgram}
    */
    _iecProgram;

    /**
     * 
     * @param {string} fileName 
     * @param {string} typeName  
     */
    constructor(fileName, typeName) {

        super(typeName);

        this._typeName = typeName;
        this._fileName = fileName;

        this._datamodel = new Datamodel(fileName, typeName, [`${typeName}.h`])
        this._exospackage.exospkg.addGenerateDatamodel(`${typeName}/${typeName}.typ`, typeName, [`${typeName}.h`], [typeName, "Linux"]);

        this._linuxPackage = this._exospackage.getNewLinuxPackage("Linux");
        this._linuxPackage.addNewFile(this._datamodel.headerFile.name, this._datamodel.headerFile.contents, this._datamodel.headerFile.description);
        this._linuxPackage.addNewFile(this._datamodel.sourceFile.name, this._datamodel.sourceFile.contents, this._datamodel.sourceFile.description);

        this._cLibrary = this._exospackage.getNewCLibrary(typeName, ``);
        this._cLibrary.addNewFile(this._datamodel.headerFile.name, this._datamodel.headerFile.contents, this._datamodel.headerFile.description);
        this._cLibrary.addNewFile(this._datamodel.sourceFile.name, this._datamodel.sourceFile.contents, this._datamodel.sourceFile.description);

        this._iecProgram = this._exospackage.getNewIECProgram(`${typeName}_0`,``);
    }

    makeComponent(location)
    {
        super.makeComponent(location);
    }
}


module.exports = {ExosComponent};