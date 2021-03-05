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
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { dir } = require('console');

const isDebugMode = () => process.env.VSCODE_DEBUG_MODE === "true";

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


	let generateSwigNodeJSTemplate = vscode.commands.registerCommand('exos-component-extension.generateSwigNodeJSTemplate', function (uri) {
		vscode.window.showInputBox({prompt:"Name of the DataType:"}).then(selection => {
			
			try {
				swigtemplate.generateNodeJSTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				vscode.window.showInformationMessage(`Generated C-Lib SWIG NodeJS Template for ${selection}`);

				if(exosas.replaceTypWithPackage(uri.fsPath, selection)) {
					vscode.window.showInformationMessage(`Replaced ${path.basename(uri.fsPath)} with ${selection} Package. The file ${path.basename(uri.fsPath)} has been copied to the ${selection.substring(0,10)} Library`);
				}
				
			} catch (error) {
				vscode.window.showErrorMessage(error);	
			}

		});
	});
	context.subscriptions.push(generateSwigNodeJSTemplate);

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
				
				finalName = `${path.dirname(uri.fsPath)}/${selection}_js`;
				fse.removeSync(finalName);
				swigtemplate.generateNodeJSTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				fse.moveSync(`${path.dirname(uri.fsPath)}/${selection}`, finalName);
				infoMessage += ` and 'C-Lib SWIG NodeJS'`;
				vscode.debug.activeDebugConsole.appendLine('C-Lib SWIG NodeJS');

				vscode.window.showInformationMessage(`${infoMessage}`);

			} catch (error) {
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
