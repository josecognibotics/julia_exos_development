const { TemplateLinuxC } = require('./templates/linux/template_linux_c');
const { TemplateLinuxStaticCLib } = require('./templates/linux/template_linux_static_c_lib');
const { TemplateLinuxCpp } = require('./templates/linux/template_linux_cpp');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponentAR } = require('./exoscomponent_ar');
const path = require('path');

/**
 * @typedef {Object} ExosComponentCOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * @property {string} templateAR template used for AR: `c-static` | `cpp` | `c-api` - default: `c-api`
 * @property {string} templateLinux template used for Linux: `c-static` | `cpp` | `c-api` - default: `c-api`
 */
class ExosComponentC extends ExosComponentAR {

    /**
     * @type {TemplateLinuxStaticCLib | TemplateLinuxCpp | TemplateLinuxC}
     */
    _templateLinux;

    /**
     * @type {ExosComponentCOptions}
     */
    _options;

    /**
     * Create a C/C++ Component template
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     * @param {ExosComponentCOptions} options
     */
    constructor(fileName, typeName, options) {
        
        let _options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`, templateAR: "c-api", templateLinux: "c-api"};

        if(options) {
            if(options.destinationDirectory) {
                _options.destinationDirectory = options.destinationDirectory;
            }
            if(options.templateAR) {
                _options.templateAR = options.templateAR;
            }
            if(options.templateLinux) {
                _options.templateLinux = options.templateLinux;
            }
        }

        super(fileName, typeName, _options.templateAR);
        this._options = _options;

        switch(this._options.templateLinux)
        {
            case "c-static":
                this._templateLinux = new TemplateLinuxStaticCLib(this._datamodel);
                break;
            case "cpp":
                this._templateLinux = new TemplateLinuxCpp(this._datamodel);
                break;
            case "c-api":
            default:
                this._templateLinux = new TemplateLinuxC(this._datamodel);
                break;
        }
        
        this._templateBuild = new TemplateLinuxBuild(typeName);      
    }

    makeComponent(location) {

        let linuxBuild = this._exospackage.exospkg.getNewWSLBuildCommand("Linux", this._templateBuild.buildScript.name);
        this._templateBuild.options.executable.enable = true;

        switch(this._options.templateLinux)
        {
            case "c-static":
                this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.staticLibraryHeader);
                this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.staticLibrarySource);
                this._templateBuild.options.executable.staticLibrary.enable = true;
                this._templateBuild.options.executable.staticLibrary.sourceFiles = [this._templateLinux.staticLibrarySource.name]
                break;
            case "cpp":
                this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.datasetHeader);
                this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.datamodelHeader);
                this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.datamodelSource);
                this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.loggerHeader);
                this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.loggerSource);

                this._templateBuild.options.executable.staticLibrary.enable = true;
                this._templateBuild.options.executable.staticLibrary.sourceFiles = [this._templateLinux.datasetHeader.name,
                                                                                    this._templateLinux.datamodelHeader.name,
                                                                                    this._templateLinux.datamodelSource.name,
                                                                                    this._templateLinux.loggerHeader.name,
                                                                                    this._templateLinux.loggerSource.name];
                break;
            case "c-api":
            default:
                break;
        }

        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.mainSource);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.termination.terminationHeader);
        this._linuxPackage.addNewBuildFileObj(linuxBuild, this._templateLinux.termination.terminationSource);

        
        this._templateBuild.options.executable.sourceFiles = [this._templateLinux.termination.terminationSource.name, this._templateLinux.mainSource.name]
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this._options.destinationDirectory;

        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.buildScript);
        this._linuxPackage.addExistingTransferDebFile(this._templateBuild.options.debPackage.fileName, this._templateBuild.options.debPackage.packageName, `${this._typeName} debian package`);

        /* Additional exospkg settings */

        this._exospackage.exospkg.addService("Runtime", `./${this._templateBuild.options.executable.executableName}`, this._templateBuild.options.debPackage.destination);
        this._exospackage.exospkg.addDatamodelInstance(`${this._templateAR.template.datamodelInstanceName}`);

        super.makeComponent(location);
    }
}

if (require.main === module) {

    process.stdout.write(`exOS C Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentC(fileName, structName, {templateAR:"c-api", templateLinux:"cpp"});
        let outDir = path.join(__dirname,path.dirname(fileName));

        process.stdout.write(`Writing ${structName} to folder: ${outDir}\n`);
        template.options.generateLinuxStaticLib = true;
        template.options.generateARStaticLib = true;
        
        template.makeComponent(outDir);     
    }
    else {
        process.stderr.write("usage: ./exoscomponent_c_template.js <filename.typ> <structname>\n");
    }
}

module.exports = {ExosComponentC};