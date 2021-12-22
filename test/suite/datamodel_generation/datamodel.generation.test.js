const assert = require('assert');
const path = require('path');
const fse = require('fs-extra');
const dircompare = require('dir-compare');
const { Test } = require('mocha');
const { ExosComponentC } = require('../../../src/components/exoscomponent_c');
const { ExosComponentNAPI } = require('../../../src/components/exoscomponent_napi');
const { ExosComponentSWIG } = require('../../../src/components/exoscomponent_swig');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const file = require('fs-extra/lib/ensure/file');
const { parseConfigFileTextToJson } = require('typescript');
const { stringify } = require('querystring');
// const myExtension = require('../extension');

suite('Datamodel generation tests', () => {
    

    // Generate from both here and AS and compare the results

    // we will get a dependency on AS and TP. Guess its ok, since thats what we are generation for anyways.

    // the typ file need to be in the AS project. Reference file is ok,
    // but then the exospkg file needs to point to the physical file, e.g. <GenerateDatamodel FileName="..\..\..\..\typfiles\StringAndArray.typ" TypeName="StringAndArray">

    
    // we could loop and find all .typ if we wanted
    // but lets keep it as an active choice to get them tested

    test('Compare to AS TP', function() {

        /*
            - Create/overwrite exospkg file with a GenerateDatamodel entry for each typ file
                Also test that typ file is in test\suite\AS\Project\Logical\typfiles\Package.pkg as a reference
            - Build AS config
            - Generate datamodel from here 
                datamodel.js: require.main === module
            - Compare
                path.resolve(__dirname, '../datamodel_generation/AS/generated/');
                path.resolve(__dirname, '../datamodel_generation/VSCE/generated/');
        */
        
    });
});
