const { ExosComponentAR } = require('./exoscomponent_ar');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { TemplateLinuxSWIG } = require('./templates/linux/template_linux_swig');

const path = require('path');

/**
 * @typedef {Object} ExosComponentSWIGOptions
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

        this._options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`, templateAR: "c-static"};

        if(options) {
            if(options.destinationDirectory) {
                this._options.destinationDirectory = options.destinationDirectory;
            }
            if(options.templateAR) {
                this._options.templateAR = options.templateAR;
            }
        }


        super(fileName, typeName, this._options.templateAR);

        this._templateBuild = new TemplateLinuxBuild(typeName);
        this._templateSWIG = new TemplateLinuxSWIG(this._datamodel);
    }

    makeComponent(location) {

        let linuxBuild = this._exospackage.exospkg.getNewWSLBuildCommand("Linux", this._templateBuild.buildScript.name);
       
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateSWIG.staticLibraryHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateSWIG.staticLibrarySource);
        
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateSWIG.swigInclude);
        
        this._templateBuild.options.swigPython.enable = true;
        this._templateBuild.options.swigPython.sourceFiles = [this._templateSWIG.staticLibrarySource.name, this._templateSWIG.swigInclude.name];
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this._options.destinationDirectory;
        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.buildScript);
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);
        this._linuxPackage.addNewTransferFileObj(this._templateSWIG.pythonMain,"Restart");
        this._exospackage.exospkg.addService("Startup", `cp ${this._templateSWIG.pythonMain.name} ${this._templateBuild.options.debPackage.destination}`);
        this._exospackage.exospkg.addService("Runtime", `python ${this._templateSWIG.pythonMain.name}`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateAR.template.datamodelInstanceName}`);

        super.makeComponent(location);
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

module.exports = {ExosComponentSWIG}