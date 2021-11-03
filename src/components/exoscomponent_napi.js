const { ExosComponent } = require('./exoscomponent');
const { TemplateARStaticCLib } = require('./templates/ar/template_ar_static_c_lib');
const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { TemplateLinuxNAPI } = require('./templates/linux/template_linux_napi');

const path = require('path');

class ExosComponentNAPI extends ExosComponent {
    /**
     * Options for manipulating the output of the `ExosComponentNAPI` class in the `makeComponent` method
     * 
     * @type {ExosComponentNAPIOptions}
     */
     options;

     constructor(fileName, typeName) {
        super(fileName, typeName);

        this._templateAR = new TemplateARDynamic(this._datamodel);
        this._templateARStatic = new TemplateARStaticCLib(this._datamodel);
        this._templateBuild = new TemplateLinuxBuild(typeName);
        this._templateNAPI = new TemplateLinuxNAPI(this._datamodel);

        this.options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`, generateARStaticLib:false, includeNodeModules:true}
    }

    makeComponent(location) {
        /* AR */

        let templateAR = this._templateAR;
        if(this.options.generateARStaticLib) {
            templateAR = this._templateARStatic;
            this._cLibrary.addNewFileObj(this._templateARStatic.staticLibraryHeader);
            this._cLibrary.addNewFileObj(this._templateARStatic.staticLibrarySource);
        }

        this._cLibrary.addNewFileObj(templateAR.libraryFun);
        this._cLibrary.addNewFileObj(templateAR.librarySource);
        this._cLibrary.addNewFileObj(templateAR.heap.heapSource);

        this._iecProgram.addNewFileObj(templateAR.iecProgramVar);
        this._iecProgram.addNewFileObj(templateAR.iecProgramST);

        /* Linux */
        let linuxBuild = this._exospackage.exospkg.getNewWSLBuildCommand("Linux", this._templateBuild.buildScript.name);

        this._templateBuild.options.napi.enable = true;
        this._templateBuild.options.napi.includeNodeModules = this.options.includeNodeModules;
        this._templateBuild.options.napi.sourceFiles = [this._templateNAPI.indexJs.name, this._templateNAPI.packageJson.name, this._templateNAPI.packageLockJson.name];
        this._templateBuild.options.debPackage.enable = true;
        this._templateBuild.options.debPackage.destination = this.options.destinationDirectory;
        this._templateBuild.makeBuildFiles();

        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.CMakeLists);
        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateBuild.buildScript);
        this._linuxPackage.addNewBuildFileObj(linuxBuild,this._templateNAPI.librarySource);
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