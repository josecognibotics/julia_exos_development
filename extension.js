// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const exostemplate = require('./exos_template');
const exosheader = require("./exos_header");
const path = require('path');
const fs = require('fs')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "exos-interface-builder" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let generateTemplate = vscode.commands.registerCommand('exos-interface-builder.generateTemplate', function (uri) {
		// The code you place here will be executed every time your command is executed

		vscode.window.showInputBox({prompt:"Name of the DataType:"}).then(selection => {
			
			try {
				exostemplate.generateTemplate(uri.fsPath, selection, path.dirname(uri.fsPath));
				vscode.window.showInformationMessage(`Generated Template for ${selection}, please dont rename this folder!`);

				//update the Package file if were in an AS project
				let pkgFileName = `${path.dirname(uri.fsPath)}/Package.pkg`;
				if (fs.existsSync(pkgFileName)) {
					let lines = fs.readFileSync(pkgFileName);
					lines = lines.split("\r").join("");
					lines = lines.split("\n");
					lines.forEach(line => {
						if(line.includes(path.basename(uri.fsPath))) {
							line = `    <Object Type="Package">${selection}</Object>`
						}
					});
					lines = lines.join("\r\n");
					fs.writeFileSync(pkgFileName,lines);
					fs.unlinkSync(uri.fsPath);

					vscode.window.showInformationMessage(`Replaced ${path.basename(uri.fsPath)} with ${selection} Package`);
				}
				
			} catch (error) {
				vscode.window.showErrorMessage(error);	
			}

		});


	});
	context.subscriptions.push(generateTemplate);

	let updateHeader = vscode.commands.registerCommand('exos-interface-builder.updateHeader', function (uri) {
		// The code you place here will be executed every time your command is executed

		try {
			let arLibFolder = `${path.dirname(uri.fsPath)}`;
			let linuxSrcFolder = `${path.dirname(uri.fsPath)}/SG4/linux`;

			let arFiles = fs.readdirSync(arLibFolder);
			let linuxFiles = fs.readdirSync(linuxSrcFolder);
			
			if(arFiles.length > 0 && linuxFiles.length > 0)
			{
				let selection = path.basename(path.dirname(arLibFolder)); //we just assume the folder name wont change

				let out = exosheader.generateHeader(uri.fsPath, selection);
				fs.writeFileSync(`${arLibFolder}/exos_${selection.toLowerCase()}.h`, out);
				fs.writeFileSync(`${linuxSrcFolder}/exos_${selection.toLowerCase()}.h`, out);

				vscode.window.showInformationMessage(`Updated Headerfile for ${selection}`);
			}
			else {
				vscode.window.showErrorMessage('Source folders cannot be found');
			}	
		

		} catch (error) {
			vscode.window.showErrorMessage(error);
		}

	});
	context.subscriptions.push(updateHeader);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
