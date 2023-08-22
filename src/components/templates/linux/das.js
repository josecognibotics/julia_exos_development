class ExosComponentJulia extends ExosComponentAR {

    /**
     * @type {TemplateLinuxJulia}
     */
    _templateLinux;

    /**
     * 
     * @type {ExosComponentJuliaOptions}
     */
    _options;

    /**
     * Create a Julia template using Julia - the template for AR is defined via the options
     * 
     * @param {string} fileName 
     * @param {string} typeName 
     * @param {ExosComponentJuliaOptions} options 
     */
    constructor(fileName, typeName, options) {

        let _options = {packaging:"none", destinationDirectory: `/home/user/${typeName.toLowerCase()}`, templateAR: "c-api", templateLinux: "julia"};

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
            if(options.packaging) {
                _options.packaging = options.packaging;
            }
        }

        super(fileName, typeName, _options.templateAR);
        this._options = _options;

        if(this._options.packaging == "none") {
            this._options.destinationDirectory = undefined;
        }

        //this._templateBuild = new TemplateLinuxBuild(typeName);
        this._templateJulia = new TemplateLinuxJulia(this._datamodel);
        //this._exospackage._exosPkg._buildCommands = [];

        //this._gitIgnore.contents += "__pycache__/\n";
        //this._gitIgnore.contents += "*.pyc\n";
    }