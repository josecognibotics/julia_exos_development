	// const writeEmitter = new vscode.EventEmitter();
	// const pty = {
	// 	onDidWrite: writeEmitter.event,
	// 	open: () => {writeEmitter.fire('\x1b[31mHello world\x1b[0m')},
	// 	close: () => {},
	// 	handleInput: data => writeEmitter.fire(data === '\r' ? '\r\n' : `>${data}>`)
	// };
	// vscode.window.createTerminal({ name: 'Local echo', pty });

	// var type = "exos-component-extension.debugConsole";
	// vscode.tasks.registerTaskProvider(type, {
	// 	provideTasks(token) {
	// 		var execution = new vscode.ShellExecution("echo \"Hello World\"");
	// 		return [
	// 			new vscode.Task({type: type}, vscode.TaskScope.Workspace,
	// 				"Debug Console", "exOS", execution)
	// 		];
	// 	},
	// 	resolveTask(task, token) {
	// 		return task;
	// 	}
	// });

	// const pty = {
	// 	onDidWrite: writeEmitter.event,
	// 	open: () => {writeEmitter.fire('\x1b[31mHello world\x1b[0m')},
	// 	close: () => {},
	// 	handleInput: data => writeEmitter.fire(data === '\r' ? '\r\n' : `>${data}>`)
	// };		
	// let myTerminal = vscode.window.createTerminal({ name: 'Local echo', pty });

	// var type = "exos-component-extension.debugConsole";
	// vscode.tasks.registerTaskProvider(type, {
	// 	provideTasks(token) {
			
	// 			let execution = new vscode.CustomExecution(terminal => {
        
	// 				return new Promise(resolve => {
						
	// 					//This is the custom task callback!
	// 					const pty = {
	// 						onDidWrite: writeEmitter.event,
	// 						open: () => {writeEmitter.fire('\x1b[31mHello world\x1b[0m')},
	// 						close: () => {},
	// 						handleInput: data => writeEmitter.fire(data === '\r' ? '\r\n' : `>${data}>`)
	// 					};		
	// 					let debugTerminal = vscode.window.createTerminal({ name: 'Local echo', pty });
	// 					debugTerminal.show();
	// 					resolve(debugTerminal);
	// 				});
	// 			});
	// 		return [new vscode.Task({type: type}, vscode.TaskScope.Workspace,
	// 			"Debug Console", "exOS",execution)];
	// 	},
	// 	resolveTask(task, token) {
	// 		//return task;
	// 		return;
	// 	}
	// });

    	/*
	'use strict';
	import * as vscode from 'vscode';

	export function activate(context: vscode.ExtensionContext) {
		var type = "exampleProvider";
		vscode.tasks.registerTaskProvider(type, {
			provideTasks(token?: vscode.CancellationToken) {
				var execution = new vscode.ShellExecution("echo \"Hello World\"");
				var problemMatchers = ["$myProblemMatcher"];
				return [
					new vscode.Task({type: type}, vscode.TaskScope.Workspace,
						"Build", "myExtension", execution, problemMatchers)
				];
			},
			resolveTask(task: vscode.Task, token?: vscode.CancellationToken) {
				return task;
			}
		});
	}
	The task definition (first argument for new Task()) needs to be contributed via package.json and can have additional properties if needed:

	"contributes": {
		"taskDefinitions": [
			{
				"type": "exampleProvider"
			}
		]
	}
	Extensions with a task provider should activate when the Tasks: Run Task command is executed:

	"activationEvents": [
		"onCommand:workbench.action.tasks.runTask"
	]
	And finally, the problem matcher(s) you want to reference need to be contributed in the package.json's contributes.problemMatchers section. 
	*/