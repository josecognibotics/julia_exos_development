const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { TemplateLinuxNAPI } = require('./templates/linux/template_linux_napi');
const { ExosComponentAR } = require('./exoscomponent_ar');

const path = require('path');

/**
 * @typedef {Object} ExosComponentNAPIOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * @property {string} templateAR template used for AR: `c-static` | `cpp` | `c-api` - default: `c-api`
 * @property {boolean} includeNodeModules include additional `node_modules` in the package - default: `true`
 */

class ExosComponentNAPI extends ExosComponentAR {

    /**
     * @type {ExosComponentNAPIOptions}
     */
     _options;

     /**
      * Create a component for N-API, the template for AR is defined via the options
      * 
      * @param {string} fileName 
      * @param {string} typeName 
      * @param {ExosComponentNAPIOptions} options 
      */
     constructor(fileName, typeName, options) {
        let _options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`, templateAR: "c-api", includeNodeModules: true};

        if(options) {
            if(options.destinationDirectory) {
                _options.destinationDirectory = options.destinationDirectory;
            }
            if(options.templateAR) {
                _options.templateAR = options.templateAR;
            }
            if(options.includeNodeModules)
            {
                _options.includeNodeModules = options.includeNodeModules;
            }
        }

        super(fileName, typeName, _options.templateAR);

        this._options = _options;

        this._templateBuild = new TemplateLinuxBuild(typeName);
        this._templateNAPI = new TemplateLinuxNAPI(this._datamodel);
    }

    makeComponent(location) {
        
        this._templateBuild.options.napi.enable = true;
        this._templateBuild.options.napi.includeNodeModules = this._options.includeNodeModules;
        this._templateBuild.options.napi.sourceFiles = [this._templateNAPI.indexJs.name, this._templateNAPI.packageJson.name, this._templateNAPI.packageLockJson.name];
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this._options.destinationDirectory;
        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateBuild.buildScript);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateNAPI.librarySource);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateNAPI.gypFile);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateNAPI.packageJson);
        this._linuxPackage.addNewBuildFileObj(this._linuxBuild, this._templateNAPI.packageLockJson);
        this._linuxPackage.addExistingFile(this._templateBuild.options.napi.nodeFileName, `${this._typeName} node module`);
        
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);
        this._linuxPackage.addNewTransferFileObj(this._templateNAPI.indexJs,"Restart");
        this._exospackage.exospkg.addService("Startup", `cp ${this._templateNAPI.indexJs.name} ${this._templateBuild.options.debPackage.destination}`);
        this._exospackage.exospkg.addService("Runtime", `npm start`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateAR.template.datamodelInstanceName}`);

        super.makeComponent(location);
    }
}

if (require.main === module) {

    process.stdout.write(`exOS N-API Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentNAPI(fileName, structName);
        let outDir = path.join(__dirname,path.dirname(fileName));

        process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);
        
        template.makeComponent(outDir);
    }
    else {
        process.stderr.write("usage: ./exoscomponent_napi.js <filename.typ> <structname>\n");
    }
}

module.exports = {ExosComponentNAPI};