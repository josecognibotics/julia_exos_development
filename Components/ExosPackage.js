const path = require('path');
const fs = require('fs');

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

class Package {

    constructor(name) {

        this._folderName = name;
        this._objects = [];
        this._pkgFile = {};
        this._header = "";
        this._footer = "";
        
    }

    getFile(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"File", name:name, description:description, contents:""});
        return this._objects.last();
    }

    _createPackage(location) {
        console.log(`Creating package folder: ${path.join(location,this._folderName)}`);
        console.log(`Creating package file: ${path.join(location,this._pkgFile.name)}`);
        console.log(this._pkgFile.contents);

        for (const obj of this._objects) {
            if(obj.type == "File") {
                console.log(`Creating file: ${path.join(location,obj.name)}`);
                console.log(obj.contents);
            }
        }
    }
}

class CLibrary extends Package {
    constructor(name) {

        super(name);

        this._header  += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header  += `<?AutomationStudio FileVersion="4.9"?>\n`;
        this._header  += `<Library SubType="ANSIC" xmlns="http://br-automation.co.at/AS/Library">\n`;
        this._header  += `  <Files>\n`;
        
        this._footer += `  </Files>\n`;
        this._footer += `  <Dependencies>\n`;
        this._footer += `    <Dependency ObjectName="ExData" />\n`;
        this._footer += `  </Dependencies>\n`;
        this._footer += `</Library>\n`;

        this._pkgFile = {type:"File", name:"ANSIC.lby", contents:""};
    }

    makePackage(location) {
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <File Description="${obj.description}">${obj.name}</File>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);
    }
}

class ExosPackage extends Package {

    constructor(name) {

        super(name);

        this._header += `<?xml version="1.0" encoding="utf-8"?>\n`;
        this._header += `<?AutomationStudio FileVersion="4.9"?>\n`;
        this._header += `<Package SubType="exosPackage" PackageType="exosPackage" xmlns="http://br-automation.co.at/AS/Package">\n`;
        this._header += `  <Objects>\n`;

        this._footer = "";
        this._footer += `  </Objects>\n`;
        this._footer += `</Package>\n`;

        this._pkgFile = {type:"File", name:"Package.pkg", contents:""};
    }

    makePackage(location) {
        
        this._pkgFile.contents = this._header;
        for (const obj of this._objects) {
            this._pkgFile.contents += `    <Object Type="${obj.type}" Description="${obj.description}">${obj.name}</Object>\n`;
        }
        this._pkgFile.contents += this._footer;

        this._createPackage(location);

        for (const obj of this._objects) {
            if(obj.type == "Library")
            {
                obj._object.makePackage(path.join(location,this._folderName));
            }
        }
    }

    getCLibrary(name, description) {
        if(description === undefined) {
            description = "";
        }

        this._objects.push({type:"Library", name:name, description:description, _object:new CLibrary(name)});

        return this._objects.last()._object;
    }

}


if (require.main === module) {
    
    exospkg = new ExosPackage("WaterTank");
    headerFile = exospkg.getFile("myheader.txt", "Headerfile");
    headerFile.contents = "hello world";
    library = exospkg.getCLibrary("WaterTank", "Watertank Library");
    libraryFile = library.getFile("watertank.h", "watertank header");
    exospkg.makePackage("C:\\Temp");

}

module.exports = {Package};