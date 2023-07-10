/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/** To demonstrate code actions associated with Diagnostics problems, this file provides a mock diagnostics entries. */

import * as vscode from 'vscode';
import * as path from 'path';
// var path = require('path');

/** Code that is used to associate diagnostic entries with code actions. */
export const POSSIBLE_THREAD_DIVERGENCE = 'possible_thread_divergence';
export const POSSIBLE_INACCURATE_ALLOCATION = 'possible_inaccurate_allocation';

let diagnosticMessage = new Map<string, string>([
	["possible_thread_divergence", "This May Cause Thread Divergence"],
	["possible_inaccurate_allocation", "Possible Inaccurate Allocation"]
]);

function exec(cmd: string, handler = function(err: string, stdout: string, stderr: string){if(err || stderr){console.log(err + ' ' + stderr);return;}else{return stdout;}}) {
	const childfork = require('child_process');
	return childfork.execSync(cmd, handler);
}

/**
 * Analyzes the text document for problems. 
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param cppcheckDiagnostics diagnostic collection
 */
export function refreshDiagnostics(context: vscode.ExtensionContext, doc: vscode.TextDocument, cppcheckDiagnostics: vscode.DiagnosticCollection): void {
	const diagnostics: vscode.Diagnostic[] = [];

	console.log(vscode.window.activeTextEditor?.document.uri.fsPath);

	// 'py ' + '\"' + context.extensionPath + '\\src' + '\\Test copy.py' + '\"'
	let cppcheckOutputString: string = String(exec('py' + ' ' + '\"' + path.join(context.extensionPath, 'src', 'Test.py') + '\"')); // Test-possible_inaccurate_allocation.py
	cppcheckOutputString = cppcheckOutputString.replace('\r\n', ''); 
	if (cppcheckOutputString !== undefined && cppcheckOutputString !== ''){
		const cppcheckOutput = cppcheckOutputString.split(" ");
		for (let i = 0; i < cppcheckOutput.length; i+=3) {
			// console.log(cppcheckOutput[i] + ' ' + cppcheckOutput[i + 1] + ' ' + cppcheckOutput[i + 2] + '\n');
			diagnostics.push(createDiagnostic(doc, cppcheckOutput[i + 1], cppcheckOutput[i + 2], doc.lineAt(parseInt(cppcheckOutput[i]) - 1), parseInt(cppcheckOutput[i]) - 1));
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

	cppcheckDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(doc: vscode.TextDocument, diagnosticCode: string, additionalInformation: string, lineOfText: vscode.TextLine, lineIndex: number): vscode.Diagnostic {
	let startingIndex;
	let endingIndex;
	let range;
	if (lineOfText.text.includes('if') || lineOfText.text.includes('while') || lineOfText.text.includes('for') || lineOfText.text.includes('cudaMalloc') || lineOfText.text.includes('malloc')) {
		if (lineOfText.text.includes('cudaMalloc') && lineOfText.text.includes(',')) {
			startingIndex = lineOfText.text.indexOf(',');
			++startingIndex;
			endingIndex = lineOfText.text.lastIndexOf(')');
			if (startingIndex == 0 || endingIndex == -1) {
				range = lineOfText.range;
			} else {
				while (lineOfText.text[startingIndex] == ' ') {
					++startingIndex;
				}
				while (lineOfText.text[endingIndex - 1] == ' ') {
					--endingIndex;
				}
				// create range that represents, where in the document the word is
				range = new vscode.Range(lineIndex, startingIndex, lineIndex, endingIndex);
			}
		}else{
			startingIndex = lineOfText.text.indexOf('(');
			++startingIndex;
			endingIndex = lineOfText.text.lastIndexOf(')');
			if (startingIndex == 0 || endingIndex == -1) {
				range = lineOfText.range;
			} else {
				// create range that represents, where in the document the word is
				range = new vscode.Range(lineIndex, startingIndex, lineIndex, endingIndex);
			}
		}
	}else if (lineOfText.text.includes('?')) { // Short-hand if
		startingIndex = lineOfText.text.indexOf('=');
		++startingIndex;
		endingIndex = lineOfText.text.indexOf('?');
		if (startingIndex == 0 || endingIndex == -1) {
			range = lineOfText.range;
		} else {
			while (lineOfText.text[startingIndex] == ' ') {
				++startingIndex;
			}
			while (lineOfText.text[endingIndex - 1] == ' ') {
				--endingIndex;
			}
			if (lineOfText.text[startingIndex] == '(' && lineOfText.text[endingIndex - 1] == ')') {
				++startingIndex;
				--endingIndex;
			}
			// create range that represents, where in the document the word is
			range = new vscode.Range(lineIndex, startingIndex, lineIndex, endingIndex);
		}
	}else if (lineOfText.text.includes('case')) {
		startingIndex = lineOfText.text.indexOf('case');
		startingIndex += 4;
		endingIndex = lineOfText.text.indexOf(':');
		if (startingIndex == 3 || endingIndex == -1) {
			range = lineOfText.range;
		} else {
			while (lineOfText.text[startingIndex] == ' ') {
				++startingIndex;
			}
			while (lineOfText.text[endingIndex - 1] == ' ') {
				--endingIndex;
			}
			if (lineOfText.text[startingIndex] == '(' && lineOfText.text[endingIndex - 1] == ')') {
				++startingIndex;
				--endingIndex;
			}
			// create range that represents, where in the document the word is
			range = new vscode.Range(lineIndex, startingIndex, lineIndex, endingIndex);
		}
	} else {
		// range = new vscode.Range(lineIndex, 0, lineIndex, lineOfText.text.length - 1);
		range = lineOfText.range;
	}

	let diagnostic;
	if (diagnosticCode == POSSIBLE_THREAD_DIVERGENCE) {
		diagnostic = new vscode.Diagnostic(range, (diagnosticMessage.get(diagnosticCode) ?? '') + ' - ' + 'Caused by Line ' + additionalInformation, vscode.DiagnosticSeverity.Warning);
	}else if (diagnosticCode == POSSIBLE_INACCURATE_ALLOCATION) {
		if (lineOfText.text.includes('cudaMalloc')) {
			diagnostic = new vscode.Diagnostic(range, (diagnosticMessage.get(diagnosticCode) ?? '') + ' - ' + 'The Number of Times cudaMalloc() was Used to Allocate Size of ' + additionalInformation + ' Does Not Match the Number of Times malloc() was Used to Allocate Size of ' + additionalInformation, vscode.DiagnosticSeverity.Warning);
		}else{
			diagnostic = new vscode.Diagnostic(range, (diagnosticMessage.get(diagnosticCode) ?? '') + ' - ' + 'The Number of Times malloc() was Used to Allocate Size of ' + additionalInformation + ' Does Not Match the Number of Times cudaMalloc() was Used to Allocate Size of ' + additionalInformation, vscode.DiagnosticSeverity.Warning);
		}
	}else{
		diagnostic = new vscode.Diagnostic(range, diagnosticMessage.get(diagnosticCode) ?? '', vscode.DiagnosticSeverity.Warning);
	}

	diagnostic.code = diagnosticCode;
	return diagnostic;
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, cppcheckDiagnostics: vscode.DiagnosticCollection): void {
	if (vscode.window.activeTextEditor) {
		refreshDiagnostics(context, vscode.window.activeTextEditor.document, cppcheckDiagnostics);
	}
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				refreshDiagnostics(context, editor.document, cppcheckDiagnostics);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(context, e.document, cppcheckDiagnostics))
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => cppcheckDiagnostics.delete(doc.uri))
	);

}
