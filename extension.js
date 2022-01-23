// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { dir } = require('console');
const os = require('os');
const net = require('net');

const isDebugMode = () => process.env.VSCODE_DEBUG_MODE === "true";

const { ExosPkg } = require('./src/exospkg')
const { Datamodel, DatatypeListItem } = require('./src/datamodel');
const { UpdateComponentResults } = require('./src/components/exoscomponent');
const { ExosComponentC, ExosComponentCUpdate } = require('./src/components/exoscomponent_c');
const { ExosComponentNAPI, ExosComponentNAPIUpdate } = require('./src/components/exoscomponent_napi');
const { ExosComponentSWIG, ExosComponentSWIGUpdate } = require('./src/components/exoscomponent_swig');
const { ExosExport, ASConfiguration } = require('./src/exosexport');

var lastIP = "127.0.0.1"

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// let taskProvider = vscode.tasks.registerTaskProvider('exostest', new vscode.Task({type:"exostest"},vscode.TaskScope.Workspace,"buildme","exOS",new vscode.ShellExecution("echo hello")));
	// context.subscriptions.push(taskProvider);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "exos-component-extension" is now active! debug is: ' +isDebugMode());

	// Set a key that can be used in when-clause in package.json
	vscode.commands.executeCommand('setContext', 'exos-component-extension.isDebugMode', isDebugMode());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	let debugTerminal = vscode.commands.registerCommand('exos-component-extension.debugConsole', function() {
		
		vscode.window.showInputBox({prompt:"IP address of the AR target:", value:lastIP}).then(selectedIP => {

			lastIP = selectedIP;
			let port = 30000;
			let ip = selectedIP;

			const writeEmitter = new vscode.EventEmitter();

			const pty = {
				onDidWrite: writeEmitter.event,
				open: () => {writeEmitter.fire(`exOS Debug Console on ${ip}\r\nPress Enter to reconnect broken connections\r\n\r\n`)},
				close: () => {},
				handleInput: data => {
					if(data === '\r')
					{
						if(!client.connecting) {
							writeEmitter.fire(`Reconnecting to ${ip}:${port}\r\n`)
							client.connect(port,ip);
						}
						else {
							writeEmitter.fire(`hold on, already connecting..\r\n`)
						}
					}
				}
			};		
			let terminal = vscode.window.createTerminal({ name: 'exOS Debug Console', pty });

			let client = new net.Socket();
			

			writeEmitter.fire(`Connecting to ${ip}:${port}\r\n`)
			client.connect(port, ip)

			client.on('timeout', () => {
				writeEmitter.fire('Disconnected\r\n');
				client.destroy();
			});

			client.on('connect', function () {
				client.setTimeout(3000);
				writeEmitter.fire('Connected\r\n');
			});

			client.on('data', function (data) {

				let lines = data.toString().replace("\r","").split("\n")
				for(line of lines) {
					if(line.length > 0) {
						writeEmitter.fire(`${line}\r\n`);
					}
				}
			});

			client.on('close', function () {
				client.destroy();
				writeEmitter.fire('Connection closed\r\n');
			});

			client.on('error', function (error) {
				client.destroy();
				writeEmitter.fire(`${prepend}Connection error (${error.code})\r\n`);
			});


			terminal.show();
		});

	});

	context.subscriptions.push(debugTerminal);


	let createPackage = vscode.commands.registerCommand('exos-component-extension.createPackage', function (uri) {

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
					vscode.window.showInformationMessage(`The file ${path.basename(uri.fsPath)} was replaced with the ${selectedStructure.label} exOS package`);
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
	context.subscriptions.push(createPackage);

	let exportPackage  = vscode.commands.registerCommand('exos-component-extension.exportPackage', function (uri) {
		
		try {
			
			let exosExport = new ExosExport(uri.fsPath);

			/** 
			 * @type {ASConfiguration[]}
			 */
			let configurations = exosExport.getConfigurations();

			let pickConfiguration = [];

			for(let configuration of configurations) {
			
				pickConfiguration.push({label: configuration.name, detail: configuration.cpu, description: configuration.description});
			}

			vscode.window.showQuickPick(pickConfiguration,{title:`Select the configuration where the ${exosExport.name} package was last built`}).then(selectedConfiguration => {
			
				let homeFolder = vscode.Uri.file(os.homedir());
				vscode.window.showOpenDialog({title:"Create binary export", defaultUri: homeFolder, canSelectFolders:true, openLabel:`Create ${exosExport.name} export here` }).then(selectedUri => {
						
					for(let selected of selectedUri) {
						try{
							exosExport.exportPackage(selected.fsPath, selectedConfiguration.label);
							vscode.window.showInformationMessage(`Exported component to: ${path.join(selected.fsPath, exosExport._folderName)}`);
						} catch (error) {
							vscode.window.showErrorMessage(error);
						}
					}
					
				});

			});

		} catch (error) {
			vscode.window.showErrorMessage(error);
		}
		
	});
	context.subscriptions.push(exportPackage);

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
					vscode.window.showErrorMessage(`Caution! ${result.parseErrors} parse error(s) occured while parsing ${path.basename(uri.fsPath)}!`);
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
				pickForceOption.push({label: "Update", detail: "Update datamodel based files"});
				pickForceOption.push({label: "Update & Recreate", detail: "Update datamodel based files, create the files if needed"});
				pickForceOption.push({label: "Update All", detail: "Update all source files including main library/application sources"});
				pickForceOption.push({label: "Update All & Recreate", detail: "Update all source files including main library/application sources, create the files if needed"});

				vscode.window.showQuickPick(pickForceOption,{title:"Select datatype which becomes the new component datamodel"}).then(selectedForceOption => {

					if(!selectedForceOption)
						return;

					let updateAll = false;
					if(selectedForceOption.label.includes("Update All")) {
						updateAll = true;
					}

					let recreate = false;
					if(selectedForceOption.label.includes("Recreate")) {
						recreate = true;
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
									let component = new ExosComponentCUpdate(uri.fsPath, updateAll);
									componentName = component._name;
									results = component.updateComponent(recreate);
								}
								break;
							case "ExosComponentNAPI":
								{
									let component = new ExosComponentNAPIUpdate(uri.fsPath, updateAll);
									componentName = component._name;
									results = component.updateComponent(recreate);
								}
								break;
							case "ExosComponentSWIG":
								{
									let component = new ExosComponentSWIGUpdate(uri.fsPath, updateAll);
									componentName = component._name;
									results = component.updateComponent(recreate);
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
							vscode.window.showInformationMessage(`Component ${componentName} updated - ${results.updateResults.filesUpdated} file(s) updated`);

							if(results.updateResults.filesNotFound > 0) {
								vscode.window.showErrorMessage(`During the update, ${results.updateResults.filesNotFound} file(s) could not be found`);
							}

							if(results.updateResults.foldersNotFound > 0) {
								vscode.window.showErrorMessage(`During the update, ${results.updateResults.foldersNotFound} folder(s) could not be found`);
							}
						}

					}
					catch(error) {
						vscode.window.showErrorMessage(error);
					}
				});

			}
			else {
				vscode.window.showErrorMessage(`Component can not be updated: missing ComponentGenerator entry`);	
			}
		}
		else {
			vscode.window.showErrorMessage(`File ${path.basename(uri.fsPath)} can not be parsed! Parse error(s): ${result.parseErrors}`);
		}
	});
	context.subscriptions.push(updateComponent);

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
			// if something else is needed, use Datamodel.getDatatypeList(uri.fsPath);
			selectedStructure = {label: path.parse(uri.fsPath).name, detail: `some debug detail`};
			infoMessage = `Generated Template for ${selectedStructure.label}: `;

			try {
				finalName = `${path.dirname(uri.fsPath)}/${selectedStructure.label}_c-api`;
				fse.removeSync(finalName);
				let templateC = new ExosComponentC(uri.fsPath, selectedStructure.label, {
					packaging: "deb", templateLinux: "c-api", templateAR: "c-api", destinationDirectory: ""
				});
				templateC.makeComponent(path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selectedStructure.label}`, finalName);
				infoMessage += `'c-api'`;
				

				finalName = `${path.dirname(uri.fsPath)}/${selectedStructure.label}_c-static`;
				fse.removeSync(finalName);
				templateC = new ExosComponentC(uri.fsPath, selectedStructure.label, {
					packaging: "deb", templateLinux: "c-static", templateAR: "c-static", destinationDirectory: ""
				});
				templateC.makeComponent(path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selectedStructure.label}`, finalName);
				infoMessage += `, 'c-static'`;
				

				finalName = `${path.dirname(uri.fsPath)}/${selectedStructure.label}_cpp`;
				fse.removeSync(finalName);
				templateC = new ExosComponentC(uri.fsPath, selectedStructure.label, {
					packaging: "deb", templateLinux: "cpp", templateAR: "cpp", destinationDirectory: ""
				});
				templateC.makeComponent(path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selectedStructure.label}`, finalName);
				infoMessage += `, 'cpp'`;
				

				finalName = `${path.dirname(uri.fsPath)}/${selectedStructure.label}_py`;
				fse.removeSync(finalName);
				templateSWIG = new ExosComponentSWIG(uri.fsPath, selectedStructure.label, {
					packaging:"deb", templateAR:"c-api", destinationDirectory: ""
				});
				templateSWIG.makeComponent(path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selectedStructure.label}`, finalName);
				infoMessage += `, 'py'`;


				finalName = `${path.dirname(uri.fsPath)}/${selectedStructure.label}_napi`;
				fse.removeSync(finalName);
				let templateNAPI = new ExosComponentNAPI(uri.fsPath, selectedStructure.label,{
					packaging: "deb", templateAR: "c-api", destinationDirectory: ""
				});
				templateNAPI.makeComponent(path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selectedStructure.label}`, finalName);
				infoMessage += ` and 'napi'`;

				vscode.window.showInformationMessage(`${infoMessage}`);

			} catch (error) {
				console.error(`Exception during generate all (infoMessage: ${infoMessage}): ${error}`);
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
