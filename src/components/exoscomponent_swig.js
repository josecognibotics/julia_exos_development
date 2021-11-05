const { ExosComponentAR, ExosComponentARUpdate } = require('./exoscomponent_ar');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { TemplateLinuxSWIG } = require('./templates/linux/template_linux_swig');
const { EXOS_COMPONENT_VERSION } = require("./exoscomponent");
const { ExosPkg } = require('../exospkg');

const path = require('path');

/**
 * @typedef {Object} ExosComponentSWIGOptions
 * @property {string} packaging  package format: `deb` | `none` - default: `deb`
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * @property {string} templateAR template used for AR: `c-static` | `cpp` | `c-api` - default: `c-static` 
 */

class ExosComponentSWIG extends ExosComponentAR {

    /**
     * 
     * @type {ExosComponentSWIGOptions}
     */
    _options;

    /**
     * Create a Python template using SWIG - the template for AR is defined via the options
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     * @param {ExosComponentSWIGOptions} options 
     */
    constructor(fileName, typeName, options) {

        let _options = {packaging:"deb", destinationDirectory: `/home/user/${typeName.toLowerCase()}`, templateAR: "c-static"};

        if(options) {
            if(options.destinationDirectory) {
                _options.destinationDirectory = options.destinationDirectory;
            }
            if(options.templateAR) {
                _options.templateAR = options.templateAR;
            }
            if(options.packaging) {
                _options.packaging = options.packaging;
            }
        }

        super(fileName, typeName, _options.templateAR);
        this._options = _options;

        if(this._options.packaging == "none") {
            this._options.destinationDirectory = undefined;
        }

        this._templateBuild = new TemplateLinuxBuild(typeName);
        this._templateSWIG = new TemplateLinuxSWIG(this._datamodel);
    }

    makeComponent(location) {
       
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateSWIG.staticLibraryHeader);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateSWIG.staticLibrarySource);
        
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateSWIG.swigInclude);
        
        this._templateBuild.options.swigPython.enable = true;
        this._templateBuild.options.swigPython.sourceFiles = [this._templateSWIG.staticLibrarySource.name, this._templateSWIG.swigInclude.name, this._datamodel.sourceFile.name];
        if(this._options.packaging == "deb") {
            this._templateBuild.options.debPackage.enable = true;
            this._templateBuild.options.debPackage.destination = this._options.destinationDirectory;
        }
        else {
            this._templateBuild.options.debPackage.enable = false;
        }

        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(this._linuxBuild,this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild,this._templateBuild.buildScript);
        
        this._linuxPackage.addNewTransferFileObj(this._templateSWIG.pythonMain,"Restart");

        if(this._options.packaging == "deb") {
            this._linuxPackage.addExistingFile(this._templateBuild.options.swigPython.pyFileName, `${this._typeName} python module`);
            this._linuxPackage.addExistingFile(this._templateBuild.options.swigPython.soFileName, `${this._typeName} SWIG library`);
            this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);
            this._exospackage.exospkg.addService("Startup", `cp ${this._templateSWIG.pythonMain.name} ${this._templateBuild.options.debPackage.destination}`);
            this._exospackage.exospkg.addService("Runtime", `python ${this._templateSWIG.pythonMain.name}`, this._templateBuild.options.debPackage.destination);
        }
        else {
            this._linuxPackage.addExistingTransferFile(this._templateBuild.options.swigPython.pyFileName, "Restart", `${this._typeName} python module`);
            this._linuxPackage.addExistingTransferFile(this._templateBuild.options.swigPython.soFileName, "Restart", `${this._typeName} SWIG library`);
            this._exospackage.exospkg.addService("Runtime", `python ${this._templateSWIG.pythonMain.name}`);
        }
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateAR.template.datamodelInstanceName}`);

        this._exospackage.exospkg.setComponentGenerator("ExosComponentSWIG", EXOS_COMPONENT_VERSION, []);

        super.makeComponent(location);
    }
}

class ExosComponentSWIGUpdate extends ExosComponentARUpdate {

    /**
     * Update class for SWIG applications, only updates the sourcefile of the datamodel-wrapper
     * @param {string} exospkgFileName absolute path to the .exospkg file stored on disk
     */
     constructor(exospkgFileName) {
        super(exospkgFileName);
     
        if(this._exosPkgParseResults.componentFound == true && this._exosPkgParseResults.componentErrors.length == 0) {
            this._templateSWIG = new TemplateLinuxSWIG(this._datamodel);

            this._linuxPackage.addNewFileObj(this._templateSWIG.staticLibraryHeader);
            this._linuxPackage.addNewFileObj(this._templateSWIG.staticLibrarySource);
            
            this._linuxPackage.addNewFileObj(this._templateSWIG.swigInclude);
        }
     }
}

if (require.main === module) {

    process.stdout.write(`exOS Python Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentSWIG(fileName, structName);
        let outDir = path.join(__dirname,path.dirname(fileName));

        process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);
        
        template.makeComponent(outDir);     
    }
    else {
        process.stderr.write("usage: ./exoscomponent_c_template.js <filename.typ> <structname>\n");
    }
}

module.exports = {ExosComponentSWIG, ExosComponentSWIGUpdate}