// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const exosheader = require("./exos_header");
const exostemplate = require('./c-template/exos_template');
const exosas = require("./c-template/exos_template_as");
const clibtemplate = require('./c-static-lib-template/template');
const clibupdate = require('./c-static-lib-template/update_static_c_lib');
const swigtemplate = require('./swig/template')
const napitemplate = require('./c-template-n-api/exos_template')
const cpptemplate = require('./cpp-template/exos_template');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { dir } = require('console');

const isDebugMode = () => process.env.VSCODE_DEBUG_MODE === "true";

const { ExosPkg } = require('./src/exospkg')
const { Datamodel, DatatypeListItem } = require('./src/datamodel');
const { UpdateComponentResults } = require('./src/components/exoscomponent');
const { ExosComponentC, ExosComponentCUpdate } = require('./src/components/exoscomponent_c');
const { ExosComponentNAPI, ExosComponentNAPIUpdate } = require('./src/components/exoscomponent_napi');
const { ExosComponentSWIG, ExosComponentSWIGUpdate } = require('./src/components/exoscomponent_swig');
const { isCatchClause } = require('typescript');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed




/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "exos-component-extension" is now active! debug is: ' +isDebugMode());

	// Set a key that can be used in when-clause in package.json
	vscode.commands.executeCommand('setContext', 'exos-component-extension.isDebugMode', isDebugMode());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	let createComponent = vscode.commands.registerCommand('exos-component-extension.createComponent', function (uri) {

		function createComponent(uri, selectedStructure, selectedASType, selectedLinuxType, selectedPackaging, destination) {
			function convertLabel2Teplate(label) {
				switch(label) {
					case "C API":
						return "c-api";
					case "C Interface":
						return "c-static";
					case "C++ Class":
						return "cpp";
					default:
						return "c-api";
				}
			}

			/**
			 * Update the Package file if were in an AS project, so that we delete the typ file and replace the 
			 * Package file with the new exos package folder (we created in createComponent)
			 * 
			 * @param {*} fsPath path to the .typ file
			 * @param {*} typeName name of the new package (the struct name everything is based on)
			 * @returns {boolean} true if the .typ file was replaced and the Package file updated, otherwise false
			 */
			function replaceTypWithPackage(fsPath, typeName) {

				let pkgFileName = `${path.dirname(fsPath)}/Package.pkg`;
				pkgFileName = path.normalize(pkgFileName);
				
				if (fs.existsSync(pkgFileName)) {
					let lines = fs.readFileSync(pkgFileName).toString();
					packageHasTypFile = false;
					lines = lines.split("\r").join("");
					lines = lines.split("\n");
					let out = "";
					for(let line of lines) 
					{
						if(line.includes(path.basename(fsPath)) && line.includes("Object") && line.includes("File")) {
							out += `    <Object Type="Package">${typeName}</Object>\r\n`;
							packageHasTypFile = true;
						}
						else {
							out += `${line}\r\n`;
						}
					}
			
					if(packageHasTypFile)
					{
						fs.writeFileSync(pkgFileName,out);
						fs.unlinkSync(fsPath);
						return true;
					}
				}   
				return false;
			}

			try
			{
				switch(selectedLinuxType.label) {
					case "C API":
					case "C Interface":
					case "C++ Class":
						let templateC = new ExosComponentC(uri.fsPath, selectedStructure.label, {
							packaging:selectedPackaging.label,
							templateLinux:convertLabel2Teplate(selectedLinuxType.label), 
							templateAR:convertLabel2Teplate(selectedASType.label),
							destinationDirectory:destination
						});
						templateC.makeComponent(path.dirname(uri.fsPath));
						break;
					case "Python Module":
						let templateSWIG = new ExosComponentSWIG(uri.fsPath, selectedStructure.label,{
							packaging:selectedPackaging.label,
							templateAR:convertLabel2Teplate(selectedASType.label),
							destinationDirectory:destination
						});
						templateSWIG.makeComponent(path.dirname(uri.fsPath));
						break;
					case "JavaScript Module":
						let templateNAPI = new ExosComponentNAPI(uri.fsPath, selectedStructure.label,{
							packaging:selectedPackaging.label,
							templateAR:convertLabel2Teplate(selectedASType.label),
							destinationDirectory:destination
						});
						templateNAPI.makeComponent(path.dirname(uri.fsPath));
						break;
					default:
						vscode.window.showErrorMessage(`The selected template for linux: ${selectedLinuxType.label} not found!`);
						return;
				}
			
				vscode.window.showInformationMessage(`Created component ${selectedStructure.label}`);
				if(replaceTypWithPackage(uri.fsPath, selectedStructure.label)) {
					vscode.window.showInformationMessage(`The file ${path.basename(uri.fsPath)} was replaced the ${selectedStructure.label} exOS package`);
				}
			}
			catch(error) {
				vscode.window.showErrorMessage(error);
			}

		}

		let availableStructures = Datamodel.getDatatypeList(uri.fsPath);
		if(!Array.isArray(availableStructures) || availableStructures.length == 0)
		{
			vscode.window.showErrorMessage(`The file ${path.basename(uri.fsPath)} has no structure definitions!`);
		}
		else
		{
			let pickStructureList = [];
			for(let struct of availableStructures) {
				if(struct.members.length > 0) {
					pickStructureList.push({label:struct.name, detail:`datasets: ${struct.members.join(", ")}`})
				}
				else {
					pickStructureList.push({label:struct.name});
				}
			}
			vscode.window.showQuickPick(pickStructureList,{title:"Select datatype which becomes the new component datamodel"}).then(selectedStructure => {

				if(!selectedStructure)
					return;

				let pickASType = []
				pickASType.push({label: "C API", detail:"AR C library direcly using the exOS C-API"});
				if(selectedStructure.detail)
				{
					pickASType.push({label: "C Interface", detail:`AR C library which uses a C interface for the ${selectedStructure.label} datamodel`})
					pickASType.push({label: "C++ Class", detail:`AR C++ library which uses a C++ class for the ${selectedStructure.label} datamodel`})
				};

				vscode.window.showQuickPick(pickASType,{title:`Using datamodel: ${selectedStructure.label} - Select which template to use for Automation Runtime`}).then(selectedASType => {
					
					if(!selectedASType)
						return;

					let pickLinuxType = [];
					pickLinuxType.push({label: "C API", detail:"C application direcly using the exOS C-API"});
					if(selectedStructure.detail) {
						pickLinuxType.push({label: "C Interface", detail:`C application which uses a C interface for the ${selectedStructure.label} datamodel`})
						pickLinuxType.push({label: "C++ Class", detail:`C++ application which uses a C++ class for the ${selectedStructure.label} datamodel`})
						pickLinuxType.push({label: "Python Module", detail:`Python application which uses a SWIG module for the ${selectedStructure.label} datamodel`})
						pickLinuxType.push({label: "JavaScript Module", detail:`nodejs JavaScript application which uses an N-API module for the ${selectedStructure.label} datamodel`})
					}
					
					vscode.window.showQuickPick(pickLinuxType,{title:`Using datamodel: ${selectedStructure.label} - Select which template to use for Linux`}).then(selectedLinuxType => {

						if(!selectedLinuxType)
							return;
					
						let pickPackaging = [];
						pickPackaging.push({label: "none", detail:"No packaging - files will run in the deployment folder on the target"});
						pickPackaging.push({label: "deb", detail:"Debian package - files will be packed and extracted at a given destination folder"});

						vscode.window.showQuickPick(pickPackaging,{title:`Select which packaging to use for Linux files`}).then(selectedPackaging => {

							if(!selectedPackaging)
								return;
						
							if(selectedPackaging.label == "deb") {
								vscode.window.showInputBox({prompt:"Set the .deb package destination folder on the target:", value:`/home/user/${selectedStructure.label.toLowerCase()}`}).then(destination => {
									if(!destination)
										return;

									createComponent(uri, selectedStructure, selectedASType, selectedLinuxType, selectedPackaging, destination);
								});
							}
							else {
								createComponent(uri, selectedStructure, selectedASType, selectedLinuxType, selectedPackaging, "");
							}
						});
						

					})

					
				});


				
			});
		}


	});
	context.subscriptions.push(createComponent);

	let exportComponent  = vscode.commands.registerCommand('exos-component-extension.exportComponent', function (uri) {
		vscode.window.showOpenDialog({title:"Create binary export", defaultUri: uri, canSelectFolders:true, openLabel:"Create binary export" }).then(selectedUri => {
			for(let selected of selectedUri) {
				vscode.window.showInformationMessage(`Exported component to: ${selected.fsPath}`);
			}
		});
	});
	context.subscriptions.push(exportComponent);

	let updateExosPkg = vscode.commands.registerCommand('exos-component-extension.updateExosPkg', function (uri) {
		
		try {
			let exospkg = new ExosPkg();
			let result = exospkg.parseFile(uri.fsPath);
			
			if(result.fileParsed) 
			{
				const editor = vscode.window.activeTextEditor;

				if (editor) {
					const document = editor.document;
					editor.edit(editBuilder => {
						let firstLine = document.lineAt(0);
						let lastLine = document.lineAt(document.lineCount - 1);
						let textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

						editBuilder.replace(textRange,exospkg.getContents());
						
					})
				}
			
				if(result.parseErrors == 0) {
					vscode.window.showInformationMessage(`Updated ${path.basename(uri.fsPath)} from version ${result.originalVersion} to ${exospkg.version}`);
					if(result.originalVersion == "1.0.0") {
						vscode.window.showInformationMessage(`Verify the sequence of the Install and Remove services`);
					}
				}
				else {
					vscode.window.showErrorMessage(`Caution! ${result.parseErrors} parse errors occured while parsing ${path.basename(uri.fsPath)}!`);
					vscode.window.showErrorMessage(`Undo and verify the original file manually!`);
				}
			}
			else {
				vscode.window.showErrorMessage(`${path.basename(uri.fsPath)} of version ${result.originalVersion} could not be parsed!`);
			}

		} catch (error) {
			vscode.window.showErrorMessage(error);	
		}
	});
	context.subscriptions.push(updateExosPkg);

	let updateComponent = vscode.commands.registerCommand('exos-component-extension.updateComponent', function (uri) {
		let exospkg = new ExosPkg();
		let result = exospkg.parseFile(uri.fsPath);
		
		if(result.fileParsed == true && result.parseErrors == 0) 
		{
			if(result.componentFound == true) {
				
				let pickForceOption = []
				pickForceOption.push({label: "Update", detail: "Update existing files"});
				pickForceOption.push({label: "Force Update", detail: "Update existing files, and create files if they do not exist"});

				vscode.window.showQuickPick(pickForceOption,{title:"Select datatype which becomes the new component datamodel"}).then(selectedForceOption => {

					if(!selectedForceOption)
						return;

					let force = false;
					if(selectedForceOption.label == "Force Update") {
						force = true;
					}

					try {
				
						/**
						 * @type {UpdateComponentResults}
						 */
						let results = {};
						let componentName = "";
						switch(exospkg.componentClass) {
							case "ExosComponentC":
								{
									let component = new ExosComponentCUpdate(uri.fsPath);
									componentName = component._name;
									results = component.updateComponent(force);
								}
								break;
							case "ExosComponentNAPI":
								{
									let component = new ExosComponentNAPIUpdate(uri.fsPath);
									componentName = component._name;
									results = component.updateComponent(force);
								}
								break;
							case "ExosComponentSWIG":
								{
									let component = new ExosComponentSWIGUpdate(uri.fsPath);
									componentName = component._name;
									results = component.updateComponent(force);
								}
								break;
							default:
								vscode.window.showErrorMessage(`Component can not be updated: class ${exospkg.componentClass} can not be found`);
								return;
						}

						if(results.parseResults.componentErrors.length > 0) {
							vscode.window.showErrorMessage(`Component ${componentName} can not be updated: Errors encountered during update`);
							for(let error of results.parseResults.componentErrors) {
								vscode.window.showErrorMessage(error);
							}
						}
						else {
							vscode.window.showInformationMessage(`Component ${componentName} updated - ${results.updateResults.filesUpdated} files updated`);

							if(results.updateResults.filesNotFound > 0) {
								vscode.window.showErrorMessage(`During the update, ${results.updateResults.filesNotFound} files could not be found`);
							}

							if(results.updateResults.foldersNotFound > 0) {
								vscode.window.showErrorMessage(`During the update, ${results.updateResults.foldersNotFound} folders could not be found`);
							}
						}

					}
					catch(error) {
						vscode.window.showErrorMessage(error);
					}
				});

			}
			else {
				vscode.window.showErrorMessage(`Component can not be updated: missing ComponentGenerator entries`);	
			}
		}
		else {
			vscode.window.showErrorMessage(`File ${path.basename(uri.fsPath)} can not be parsed! Parse errors: ${result.parseErrors}`);
		}
	});
	context.subscriptions.push(updateComponent);

	let generateTemplate = vscode.commands.registerCommand('exos-component-extension.generateTemplate', function (uri) {
		// The code you place here will be executed every time your command is executed

		vscode.window.showInputBox({prompt:"Name of the DataType:"}).then(selection => {
			
			try {
				exostemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				vscode.window.showInformationMessage(`Generated Template for ${selection}`);

				if(exosas.replaceTypWithPackage(uri.fsPath, selection)) {
					vscode.window.showInformationMessage(`Replaced ${path.basename(uri.fsPath)} with ${selection} Package. The file ${path.basename(uri.fsPath)} has been copied to the ${selection.substring(0,10)} task package`);
				}
				
			} catch (error) {
				vscode.window.showErrorMessage(error);	
			}

		});


	});
	context.subscriptions.push(generateTemplate);

	let generateCLibTemplate = vscode.commands.registerCommand('exos-component-extension.generateCLibTemplate', function (uri) {
		vscode.window.showInputBox({prompt:"Name of the DataType:"}).then(selection => {
			
			try {
				clibtemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				vscode.window.showInformationMessage(`Generated C-Lib Template for ${selection}`);

				if(exosas.replaceTypWithPackage(uri.fsPath, selection)) {
					vscode.window.showInformationMessage(`Replaced ${path.basename(uri.fsPath)} with ${selection} Package. The file ${path.basename(uri.fsPath)} has been copied to the ${selection.substring(0,10)} Library`);
				}
				
			} catch (error) {
				vscode.window.showErrorMessage(error);	
			}

		});
	});
	context.subscriptions.push(generateCLibTemplate);


	let updateCLib = vscode.commands.registerCommand('exos-component-extension.updateCLib', function (uri) {		
		try {
			let selection = clibupdate.updateLibrary(uri.fsPath);
			vscode.window.showInformationMessage(`Updated C-Lib Template for ${selection}`);

		} catch (error) {
			vscode.window.showErrorMessage(error);	
		}
	});
	context.subscriptions.push(updateCLib);

	let updateCLib_py = vscode.commands.registerCommand('exos-component-extension.updateCLib_py', function (uri) {		
		try {
			let selection = clibupdate.updateLibrary(uri.fsPath, "python");
			vscode.window.showInformationMessage(`Updated C-Lib SWIG Python Template for ${selection}`);

		} catch (error) {
			vscode.window.showErrorMessage(error);	
		}
	});
	context.subscriptions.push(updateCLib_py);

	let generateSwigPythonTemplate = vscode.commands.registerCommand('exos-component-extension.generateSwigPythonTemplate', function (uri) {
		vscode.window.showInputBox({prompt:"Name of the DataType:"}).then(selection => {
			
			try {
				swigtemplate.generatePythonTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				vscode.window.showInformationMessage(`Generated C-Lib SWIG Python Template for ${selection}`);

				if(exosas.replaceTypWithPackage(uri.fsPath, selection)) {
					vscode.window.showInformationMessage(`Replaced ${path.basename(uri.fsPath)} with ${selection} Package. The file ${path.basename(uri.fsPath)} has been copied to the ${selection.substring(0,10)} Library`);
				}
				
			} catch (error) {
				vscode.window.showErrorMessage(error);	
			}

		});
	});
	context.subscriptions.push(generateSwigPythonTemplate);

	let generateNapiNodeJSTemplate = vscode.commands.registerCommand('exos-component-extension.generateNapiNodeJSTemplate', function (uri) {
		vscode.window.showInputBox({prompt:"Name of the DataType:"}).then(selection => {
			try {
				napitemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				vscode.window.showInformationMessage(`Generated Node-API Template for ${selection}`);

				if(exosas.replaceTypWithPackage(uri.fsPath, selection)) {
					vscode.window.showInformationMessage(`Replaced ${path.basename(uri.fsPath)} with ${selection} Package. The file ${path.basename(uri.fsPath)} has been copied to the ${selection.substring(0,10)} Library`);
				}
				
			} catch (error) {
				vscode.window.showErrorMessage(error);	
			}

		});
	});
	context.subscriptions.push(generateNapiNodeJSTemplate);

	let updateNapiNodeJSTemplate = vscode.commands.registerCommand('exos-component-extension.updateNapiNodeJSTemplate', function (uri) {
		try {
			let selection = napitemplate.updateTemplate(uri.fsPath);
			vscode.window.showInformationMessage(`Updated Node-API template for ${selection}`);

		} catch (error) {
			vscode.window.showErrorMessage(error);
		}
	});
	context.subscriptions.push(updateNapiNodeJSTemplate);

	let binExportNapiNodeJSTemplate = vscode.commands.registerCommand('exos-component-extension.binExportNapiNodeJSTemplate', function (uri) {
		vscode.window.showInputBox({ value: path.dirname(uri.fsPath), prompt: "Export path:" })
			.then(exportPath => {
				napitemplate.binExport(uri.fsPath, path.dirname(uri.fsPath), exportPath)
					.then((result) => {
						vscode.window.showInformationMessage(`Binary export of Node-API exOS component "${result.component}" with binaries from Automation Studio configuration "${result.binaries_config}" done at ${exportPath}`);
					})
					.catch((error) => {
				vscode.window.showErrorMessage(error);
					});
			})
			.catch(error => {
				vscode.window.showErrorMessage(error);
		});
	});
	context.subscriptions.push(binExportNapiNodeJSTemplate);


	let generateCppTemplate = vscode.commands.registerCommand('exos-component-extension.generateCppTemplate', function (uri) {
		vscode.window.showInputBox({prompt:"Name of the DataType:"}).then(selection => {
			
			try {
				cpptemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				vscode.window.showInformationMessage(`Generated C++ Template for ${selection}`);

				if(exosas.replaceTypWithPackage(uri.fsPath, selection)) {
					vscode.window.showInformationMessage(`Replaced ${path.basename(uri.fsPath)} with ${selection} Package. The file ${path.basename(uri.fsPath)} has been copied to the ${selection.substring(0,10)} Library`);
				}
				
			} catch (error) {
				vscode.window.showErrorMessage(error);	
			}

		});
	});
	context.subscriptions.push(generateCppTemplate);

	let updateCppTemplate = vscode.commands.registerCommand('exos-component-extension.updateCppTemplate', function (uri) {
		try {
			let selection = cpptemplate.updateTemplate(uri.fsPath);
			vscode.window.showInformationMessage(`Updated C++ template for ${selection}`);

		} catch (error) {
			vscode.window.showErrorMessage(error);
		}
	});
	context.subscriptions.push(updateCppTemplate);


	if (isDebugMode()) 
	{
		/* 
			The purpose of this generate-everything-function is to easier compare generated templates before and after changes to the generators.
				1) Generate everything
				2) Initialize a git repo (or just copy the generated folders somewhere else for later comparision)
				3) Change generators
				4) Generate everything
				5) Compare the new and old
		*/
		let generateEverythingDebug = vscode.commands.registerCommand('exos-component-extension.generateEverythingDebug', function (uri) {
			
			// Expecting the structure name to be the same as the name of the .typ file (no ext)
			selection = path.parse(uri.fsPath).name;
			infoMessage = `Generated Template for ${selection}: `;
			vscode.debug.activeDebugConsole.appendLine(infoMessage);

			try {
				finalName = `${path.dirname(uri.fsPath)}/${selection}_pure`;
				fse.removeSync(finalName);
				exostemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selection}`, finalName);
				infoMessage += `'C'`;
				vscode.debug.activeDebugConsole.appendLine('C');
				
				finalName = `${path.dirname(uri.fsPath)}/${selection}_clib`;
				fse.removeSync(finalName);
				clibtemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selection}`, finalName);
				infoMessage += `, 'C-Lib'`;
				vscode.debug.activeDebugConsole.appendLine('C-Lib');
				
				finalName = `${path.dirname(uri.fsPath)}/${selection}_py`;
				fse.removeSync(finalName);
				swigtemplate.generatePythonTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selection}`, finalName);
				infoMessage += `, 'C-Lib SWIG Python'`;
				vscode.debug.activeDebugConsole.appendLine('C-Lib SWIG Python');

				finalName = `${path.dirname(uri.fsPath)}/${selection}_napi`;
				fse.removeSync(finalName);
				napitemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selection}`, finalName);
				infoMessage += `, 'Node-API'`;
				vscode.debug.activeDebugConsole.appendLine('Node-API');

				finalName = `${path.dirname(uri.fsPath)}/${selection}_cpp`;
				fse.removeSync(finalName);
				cpptemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selection}`, finalName);
				infoMessage += ` and 'C++'`;
				vscode.debug.activeDebugConsole.appendLine('C++');

				vscode.window.showInformationMessage(`${infoMessage}`);

			} catch (error) {
				vscode.debug.activeDebugConsole.appendLine(error);
				vscode.window.showErrorMessage(error);
			}
		});
		context.subscriptions.push(generateEverythingDebug);
	}
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
