const { ExosPackage, IECProgram, LinuxPackage, CLibrary} = require('../exospackage');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { Datamodel } = require('../datamodel');

const path = require('path')
const fs = require('fs')

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

    /**
     * name of the IEC datatype used to generate the datamodel, {@link _name} is also set to this {@link _typeName}
     * @type {string}
    */
    _typeName;

    /**
     * name of the .typ source file for generating the datamodel 
     * @type {string}
    */
    _fileName;

    /**
     * generated datamodel using {@link _typeName} and `{typeName}.h` as SGInclude 
     * @type {Datamodel}
    */
    _datamodel;

    /**
     * {@link CLibrary} for AR created in the folder `{typeName}`. by default, the package only contains generated headerfiles
     * @type {CLibrary}
    */
    _cLibrary;

    /**
     * {@link IECProgram} for AR created in the folder `{typeName}_0`. by default, the package does not contain any files
     * @type {IECProgram}
    */
    _iecProgram;

    /**
     * {@link LinuxPackage} created in the folder `Linux`. by default, the package only contains generated headerfiles
     * @type {LinuxPackage}
    */
     _linuxPackage;

    /**
     * {@link TemplateLinuxBuild} for creating CMake and build script, not yet added to the _linuxPackage
      * @type {TemplateLinuxBuild}
      */
    _templateBuild;


    /**
     * `buildCommand` which is used for all the `this.linuxPackage.addBuildFile` commands
     * @type {object}
     */
    _linuxBuild;

    /**
     * Creates an exOS package from the given `fileName/typeName` and generates headerfiles in the AR Library and the Linux Pacakge
     * It also generates a Linux WSL build command, with headerfiles added as build dependecies
     * 
     * Following objects should be used in inherited classes
     * - {@linkcode _datamodel} datamodel for the `fileName/typeName` with an _SG4 include being the AR Library
     * - {@linkcode _cLibrary} C/C++ library for AR with the name of the datatype (typeName)
     * - {@linkcode _iecProgram} IEC program that uses the Library
     * - {@linkcode _linuxPackage} Linux package
     * 
     * @param {string} fileName 
     * @param {string} typeName  
     */
    constructor(fileName, typeName) {

        super(typeName);

        this._typeName = typeName;
        this._fileName = fileName;

        this._typFile = {name:`${typeName}.typ`, contents:fs.readFileSync(fileName).toString(), description:`${typeName} datamodel declaration`}

        this._datamodel = new Datamodel(fileName, typeName, [`${typeName}.h`])
        this._exospackage.exospkg.addGenerateDatamodel(`${typeName}/${typeName}.typ`, typeName, [`${typeName}.h`], [typeName, "Linux"]);

        this._iecProgram = this._exospackage.getNewIECProgram(`${typeName.substr(0,10)}_0`,`${typeName} application`);

        this._cLibrary = this._exospackage.getNewCLibrary(typeName.substr(0,10), `${typeName} exOS library`);
        this._cLibrary.addNewFileObj(this._typFile);
        this._cLibrary.addNewFileObj(this._datamodel.headerFile);
        this._cLibrary.addNewFileObj(this._datamodel.sourceFile);


        this._templateBuild = new TemplateLinuxBuild(typeName);  
        this._linuxBuild = this._exospackage.exospkg.getNewWSLBuildCommand("Linux", this._templateBuild.buildScript.name);

        this._linuxPackage = this._exospackage.getNewLinuxPackage("Linux",`${typeName} Linux resources`);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._datamodel.headerFile);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._datamodel.sourceFile);

    }

    makeComponent(location)
    {
        super.makeComponent(location);
    }
}


module.exports = {ExosComponent};