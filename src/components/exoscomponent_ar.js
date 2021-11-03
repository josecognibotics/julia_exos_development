const { TemplateARDynamic } = require('./templates/ar/template_ar_dynamic');
const { TemplateARStaticCLib } = require('./templates/ar/template_ar_static_c_lib');
const { TemplateARCpp } = require('./templates/ar/template_ar_cpp');
const { ExosComponent } = require('./exoscomponent');


class ExosComponentAR extends ExosComponent {

    /**
     * @type {string} `c-static` | `cpp` | `c-api` - default: `c-api` 
     */
    _template;

    /**
     * @type {TemplateARStaticCLib | TemplateARCpp | TemplateARDynamic}
     */
    _templateAR;

    /**
     * 
     * @param {*} fileName 
     * @param {*} typeName 
     * @param {string} template `c-static` | `cpp` | `c-api` - default: `c-api` 
     */
    constructor(fileName, typeName, template) {
        
        super(fileName, typeName);

        this._template = template;
        switch(this._template)
        {
            case "c-static":
                this._templateAR = new TemplateARStaticCLib(this._datamodel);
                break;
            case "cpp":
                this._templateAR = new TemplateARCpp(this._datamodel);
                break;
            case "c-api":
            default:
                this._templateAR = new TemplateARDynamic(this._datamodel);
                break;
        }
    }

    makeComponent(location) {
    
        this._cLibrary.addNewFileObj(this._templateAR.libraryFun);
        this._cLibrary.addNewFileObj(this._templateAR.librarySource);
        this._cLibrary.addNewFileObj(this._templateAR.heap.heapSource);

        switch(this._template)
        {
            case "c-static":
                this._cLibrary.addNewFileObj(this._templateAR.staticLibraryHeader);
                this._cLibrary.addNewFileObj(this._templateAR.staticLibrarySource);
                break;
            case "cpp":
                this._cLibrary.addNewFileObj(this._templateAR.datasetHeader);
                this._cLibrary.addNewFileObj(this._templateAR.datamodelHeader);
                this._cLibrary.addNewFileObj(this._templateAR.datamodelSource);
                this._cLibrary.addNewFileObj(this._templateAR.loggerHeader);
                this._cLibrary.addNewFileObj(this._templateAR.loggerSource);
                break;
            case "c-api":
            default:
                break;
        }
        
        this._iecProgram.addNewFileObj(this._templateAR.iecProgramVar);
        this._iecProgram.addNewFileObj(this._templateAR.iecProgramST);

        super.makeComponent(location);
    }
}

module.exports = { ExosComponentAR };