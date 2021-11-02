const { TemplateLinuxBuild } = require('./templates/linux/template_linux_build');
const { ExosComponent } = require('./exoscomponent');
const { TemplateCppLib } = require('./templates/template_cpp_lib');

const path = require('path');

/**
 * @typedef {Object} ExosComponentCppOptions
 * @property {string} destinationDirectory destination of the generated executable in Linux. default: `/home/user/{typeName.toLowerCase()}`
 * 
 */

class ExosComponentCpp extends ExosComponent{

    /**
     * Options for manipulating the output of the `ExosComponentCTemplate` class in the `makeComponent` method
     * 
     * @type {ExosComponentCppOptions}
     */
    options;

    constructor(fileName, typeName) {
        super(fileName, typeName);

        this._templateCppAR = new TemplateCppLib(this._datamodel, false);
        this._templateCppLinux = new TemplateCppLib(this._datamodel, true);

        this._templateBuild = new TemplateLinuxBuild(typeName);
        this.options = {destinationDirectory: `/home/user/${typeName.toLowerCase()}`}

    }

    makeComponent(location) {
        
    
        super.makeComponent(location);
    }
}


if (require.main === module) {

    process.stdout.write(`exOS C++ Template\n`);

    if (process.argv.length > 3) {

        let fileName = process.argv[2];
        let structName = process.argv[3];

        let template = new ExosComponentCpp(fileName, structName);
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

module.exports = {ExosComponentCpp};