const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const dircompare = require('dir-compare');
const { Test } = require('mocha');
const { ExosComponentC } = require('../../../src/components/exoscomponent_c');
const { ExosComponentNAPI } = require('../../../src/components/exoscomponent_napi');
const { ExosComponentSWIG } = require('../../../src/components/exoscomponent_swig');
const { ExosPkg } = require('../../../src/exospkg')
const { ExosPackage, Package } = require('../../../src/exospackage')
const { Datamodel } = require('../../../src/datamodel')

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const file = require('fs-extra/lib/ensure/file');
const { parseConfigFileTextToJson } = require('typescript');
const { stringify } = require('querystring');
// const myExtension = require('../extension');
const parser = require('xml-parser');
const child_process = require('child_process');
const { doesNotMatch } = require('assert');

suite('Datamodel generation tests (includes AS build, so might be lengthy)', () => {
    
    // Generate from both VS code extension and AS TP and compare the results

    // we will get a dependency on AS and TP. Guess its ok, since thats what we are generation for anyways.

    // the typ file need to be in the AS project.
    // Reference file is ok, the exospkg file needs to point to the physical file, e.g.:
    // <GenerateDatamodel FileName="..\..\..\..\typfiles\StringAndArray.typ" TypeName="StringAndArray">

    test('Compare to AS TP', function() {

        // we could loop and find all .typ if we wanted
        // but lets keep it as an active choice to get them tested
        // (add to typNames array)
        
        // The names must match both the filename and the STRUCT name
        // Remember to also add them as reference files in ../AS/Project/Logical/typfiles/Package.pkg
        typNames = [
            "StringAndArray",
            "ros_topics_typ"
        ];
 
        /*
            Update exospkg file with a GenerateDatamodel entry for each typ file
            Test that typ file is in test\suite\AS\Project\Logical\typfiles\Package.pkg as a reference
            Generate the VS Code extension version of the datamodel
        */
        exospkgFileName = path.resolve(__dirname, '../AS/Project/Logical/Package/Package.exospkg');
        
        let exosPkg = new ExosPkg();
        exosPkgParseResult = exosPkg.parseFile(exospkgFileName);
        exosPkg._generateDatamodels = []; // clean out existing GenerateDatamodels (although its not nice to mess with the privates...)
        assert.equal(exosPkgParseResult.componentFound == true && exosPkgParseResult.componentErrors.length == 0, true, `Parse ${exospkgFileName} failed`);

        packagePkg = path.resolve(__dirname, '../AS/Project/Logical/typfiles/Package.pkg')
        assert.equal(fs.existsSync(packagePkg), true, `${packagePkg} does not exist, needed for AS to build`)
        let packagePkgContents = fs.readFileSync(packagePkg).toString();

        let genPath = path.resolve(__dirname, `../datamodel_generation/generated/`);
        fse.emptyDirSync(genPath);

        typNames.forEach(typName => {
            // Test that the package file contains the typ file (otherwise AS wont generate it)
            //a little simplified test, doesnt test if it actually is the same file in the same location
            assert.equal(packagePkgContents.includes(typName), true, `${typName} not found in ${packagePkg} (add reference file to the typ file)`);
        
            typFile = "../../../../typfiles/" + `${typName}.typ`;

            SG4Includes = [`${typName.substr(0,10)}.h`];
            exosPkg.addGenerateDatamodel(typFile, typName, SG4Includes, [`../../../../datamodel_generation/generated/AS/${typName}/`]);

            // Generate datamodel js version
            let datamodel = new Datamodel(path.resolve(__dirname, '../AS/Project/Logical/typfiles/', typFile), typName, SG4Includes);
            let outDir = path.resolve(__dirname, `../datamodel_generation/generated/VSCE/${typName}/`);
            fse.emptyDirSync(outDir); //createDir

            fs.writeFileSync(path.join(outDir,`exos_${typName.toLowerCase()}.h`), datamodel.headerFile.contents);
            fs.writeFileSync(path.join(outDir,`exos_${typName.toLowerCase()}.c`), datamodel.sourceFile.contents);
        });

        if(fs.existsSync(exospkgFileName)) {
            
            fs.writeFileSync(exospkgFileName, exosPkg.getContents());
        }
        
        /*
            Build AS config to generate the AS version of the datamodel
            Find and use AS install path
        */
        apjFile = path.resolve(__dirname, '../AS/Project/Project.apj');
        assert.equal(fs.existsSync(apjFile), true, `${apjFile} does not exist, needed for AS to build`);

        let packageXML = fs.readFileSync(apjFile).toString();
        let versionXML = packageXML.match(/<\?AutomationStudio\/?[^>]+(\?>|$)/g); //the xml-parser doesnt like this entry
        assert.notEqual(versionXML, null, `${apjFile} does not contain <?AutomationStudio tag`);
        versionXML = versionXML[0];
        versionXML = versionXML.replace("<?", "<");
        versionXML = versionXML.replace("?>", ">");
        packageXML = packageXML.replace(/<\?AutomationStudio\/?[^>]+(\?>|$)/g, versionXML);

        let packageXMLparsed = parser(packageXML);
        let ASVersion = packageXMLparsed.root.attributes.Version;
        assert.notEqual(ASVersion, null, `${apjFile} parsed xml does not contain Version`);
        ASVersion = ASVersion.split(".");
		let ASMajor = ASVersion[0];
        let ASMinor = ASVersion[1];
        let ASInstallPath = path.resolve('C:/BrAutomation/', `AS${ASMajor}${ASMinor}`);
        assert.equal(fs.existsSync(ASInstallPath), true, `${ASInstallPath} does not exist, needed for AS to build`);
        let ASBuilder = path.resolve(`${ASInstallPath}`, 'Bin-en/BR.AS.build.exe');
        assert.equal(fs.existsSync(ASBuilder), true, `${ASBuilder} does not exist, needed for AS to build`);

        let ret = child_process.spawnSync(`${ASBuilder}`, [`-c Config1`, `${apjFile}`]);
        assert.notEqual(ret.pid, 0, `command not started: ${ASBuilder} -c Config1 ${apjFile}`);
        // Return values from BR.AS.Build.exe: 0 = No errors or warnings, 1 = Warnings only, 3 = Build error 
        assert.notEqual(ret.status, 3, `build not successful: ${ASBuilder} -c Config1 ${apjFile}: \nOutput from command:\n ${ret.stdout.toString()}`);

        /*
            Compare AS version and VS Code extension version of the datamodel
        */
        genPathAS = path.resolve(__dirname, '../datamodel_generation/generated/AS/');
        assert.equal(fse.existsSync(genPathAS), true, `${genPathAS} doesnt exist`);

        genPathVSCE = path.resolve(__dirname, '../datamodel_generation/generated/VSCE/');
        assert.equal(fse.existsSync(genPathVSCE), true, `${genPathVSCE} doesnt exist`);

        /*
        // TODO: do the actual compare. Now it will fail due to TP and VSe not doing the same for uninitialized enums (TP is )
        dirOptions = {
            compareContent: true,
            compareFileSync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
            ignoreLineEnding: true
        };
        compRes = dircompare.compareSync(genPathAS, genPathVSCE, dirOptions);
        if (compRes.differences > 0) {
            assert.equal(compRes.differences, 0, `One or more generated datamodel(s) from AS differs from VS code extension (${genPathAS} vs. ${genPathVSCE})`);
        }
        */
        
        this.timeout(0); // avoid Error: Timeout of 2000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.
    });
});
