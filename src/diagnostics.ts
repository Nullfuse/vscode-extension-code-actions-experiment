/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/** To demonstrate code actions associated with Diagnostics problems, this file provides a mock diagnostics entries. */

import * as vscode from 'vscode';
import * as path from 'path';
// var path = require('path');

/** Code that is used to associate diagnostic entries with code actions. */
export const POSSIBLE_THREAD_DIVERGENCE = 'possible_thread_divergence';

let diagnosticMessage = new Map<string, string>([
	["possible_thread_divergence", "This May Cause Thread Divergence"]
]);

function exec(cmd: string, handler = function(err: string, stdout: string, stderr: string){if(err || stderr){console.log(err + ' ' + stderr);return;}else{return stdout;}}) {
	const childfork = require('child_process');
	return childfork.execSync(cmd, handler);
}

/**
 * Analyzes the text document for problems. 
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param threadDivergenceDiagnostics diagnostic collection
 */
export function refreshDiagnostics(context: vscode.ExtensionContext, doc: vscode.TextDocument, threadDivergenceDiagnostics: vscode.DiagnosticCollection): void {
	const diagnostics: vscode.Diagnostic[] = [];

	console.log(vscode.window.activeTextEditor?.document.uri.fsPath);

	// 'py ' + '\"' + context.extensionPath + '\\src' + '\\Test copy.py' + '\"'
	let cppcheckOutputString = exec('py' + ' ' + '\"' + path.join(context.extensionPath, 'src', 'Test.py') + '\"');
	if (cppcheckOutputString !== undefined){
		const cppcheckOutput = String(cppcheckOutputString).split(" ");
		for (let i = 0; i < cppcheckOutput.length - 2; i+=2) {
			console.log(cppcheckOutput[i] + ' ' + cppcheckOutput[i + 1] + '\n');
			diagnostics.push(createDiagnostic(doc, cppcheckOutput[i + 1], doc.lineAt(parseInt(cppcheckOutput[i]) - 1), parseInt(cppcheckOutput[i]) - 1, 0, 0));
		}
	}

	/*
	let cppcheckOutputString = exec('py ' + '\"' + context.extensionPath + '\\src' + '\\Test.py' + '\"');
	if (cppcheckOutputString !== undefined){
		const cppcheckOutput = String(cppcheckOutputString).split(" ");
		for (let i = 0; i < cppcheckOutput.length - 4; i+=4) {
			console.log(cppcheckOutput[i] + ' ' + cppcheckOutput[i + 1] + ' ' + cppcheckOutput[i + 2] + ' ' + cppcheckOutput[i + 3] + '\n');
			diagnostics.push(createDiagnostic(doc, doc.lineAt(parseInt(cppcheckOutput[i]) - 1), parseInt(cppcheckOutput[i]) - 1, parseInt(cppcheckOutput[i + 2]) - 1, parseInt(cppcheckOutput[i + 3]) - 1));
		}
	}
	*/

	/*
	const cp = require('child_process')
	cp.exec('py ' + '\"' + context.extensionPath + '\\src' + '\\Test.py' + '\"', (err: string, stdout: string, stderr: string) => {
		if (err) {
			console.log('error: ' + err);
		}
		if (stdout) {
			console.log(stdout);
			const cppcheckOutput = stdout.split(" ");
			for (let i = 0; i < cppcheckOutput.length - 4; i+=4) {
				console.log(cppcheckOutput[i] + ' ' + cppcheckOutput[i + 1] + ' ' + cppcheckOutput[i + 2] + ' ' + cppcheckOutput[i + 3] + '\n');
				diagnostics.push(createDiagnostic(doc, doc.lineAt(parseInt(cppcheckOutput[i]) - 1), parseInt(cppcheckOutput[i]) - 1, parseInt(cppcheckOutput[i + 2]), parseInt(cppcheckOutput[i + 3])));
			}
		}
		if (stderr) {
			console.log('stderr: ' + stderr);
		}
	});
	*/

	/*
	const cppcheckOutput = ['10', 'threadIdx', '8', '14', '13', 'threadIdx', '8', '14', '16', 'threadIdx', '8', '14', '28', 'threadIdx', '9', '28', '28', 'threadIdx', '30', '35'];
	for (let i = 0; i < cppcheckOutput.length - 4; i+=4) {
		console.log(cppcheckOutput[i] + ' ' + cppcheckOutput[i + 1] + ' ' + cppcheckOutput[i + 2] + ' ' + cppcheckOutput[i + 3] + '\n');
		diagnostics.push(createDiagnostic(doc, doc.lineAt(parseInt(cppcheckOutput[i]) - 1), parseInt(cppcheckOutput[i]) - 1, parseInt(cppcheckOutput[i + 2]) - 1, parseInt(cppcheckOutput[i + 3]) - 1));
	}
	*/

	threadDivergenceDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(doc: vscode.TextDocument, diagnosticCode: string, lineOfText: vscode.TextLine, lineIndex: number, startColumnNumber: number, endColumnNumber: number): vscode.Diagnostic {
	// create range that represents, where in the document the word is
	// const range = new vscode.Range(lineIndex, startColumnNumber, lineIndex, endColumnNumber);

	const diagnostic = new vscode.Diagnostic(lineOfText.range, diagnosticMessage.get(diagnosticCode) ?? '', vscode.DiagnosticSeverity.Warning);
	diagnostic.code = diagnosticCode;
	return diagnostic;
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, threadDivergenceDiagnostics: vscode.DiagnosticCollection): void {
	if (vscode.window.activeTextEditor) {
		refreshDiagnostics(context, vscode.window.activeTextEditor.document, threadDivergenceDiagnostics);
	}
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				refreshDiagnostics(context, editor.document, threadDivergenceDiagnostics);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(context, e.document, threadDivergenceDiagnostics))
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => threadDivergenceDiagnostics.delete(doc.uri))
	);

}
