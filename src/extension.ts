/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { subscribeToDocumentChanges, POSSIBLE_THREAD_DIVERGENCE, POSSIBLE_INACCURATE_ALLOCATION } from './diagnostics';

const COMMAND = 'code-actions-sample.command';
const COMMAND_THREAD_DIVERGENCE = 'code-actions-thread-divergence.command';
const COMMAND_INACCURATE_ALLOCATION = 'code-actions-inaccurate-allocation.command';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(['cuda', 'cpp', 'cuda-cpp'], new correctCode(), {
			providedCodeActionKinds: correctCode.providedCodeActionKinds
		}));

	const cppcheckDiagnostics = vscode.languages.createDiagnosticCollection("cppcheckDiagnostics");
	context.subscriptions.push(cppcheckDiagnostics);

	subscribeToDocumentChanges(context, cppcheckDiagnostics);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(['cuda', 'cpp', 'cuda-cpp'], new inefficiencyInfo(), {
			providedCodeActionKinds: inefficiencyInfo.providedCodeActionKinds
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND, () => vscode.env.openExternal(vscode.Uri.parse('about:blank')))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_THREAD_DIVERGENCE, () => vscode.env.openExternal(vscode.Uri.parse('https://cvw.cac.cornell.edu/gpu/thread_div')))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_INACCURATE_ALLOCATION, () => vscode.env.openExternal(vscode.Uri.parse('https://cvw.cac.cornell.edu/gpu/memory_mang')))
	);
}

/**
 * Provides code actions for converting :) to a smiley emoji.
 */
export class correctCode implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
		if (!this.isAtStartOfSmiley(document, range)) {
			return;
		}

		const replaceWithSmileyCatFix = this.createFix(document, range, '😺');

		const replaceWithSmileyFix = this.createFix(document, range, '😀');
		// Marking a single fix as `preferred` means that users can apply it with a
		// single keyboard shortcut using the `Auto Fix` command.
		replaceWithSmileyFix.isPreferred = true;

		const replaceWithSmileyHankyFix = this.createFix(document, range, '💩');

		const commandAction = this.createCommand();

		return [
			replaceWithSmileyCatFix,
			replaceWithSmileyFix,
			replaceWithSmileyHankyFix,
			commandAction
		];
	}

	private isAtStartOfSmiley(document: vscode.TextDocument, range: vscode.Range) {
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character] === ':' && line.text[start.character + 1] === ')';
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range, emoji: string): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Convert to ${emoji}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		fix.edit.replace(document.uri, new vscode.Range(range.start, range.start.translate(0, 2)), emoji);
		return fix;
	}

	private createCommand(): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more...', vscode.CodeActionKind.Empty);
		action.command = { command: COMMAND, title: 'Learn more about [Text]', tooltip: 'This will open [Text].' };
		return action;
	}
}

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class inefficiencyInfo implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		// for each diagnostic entry that has the matching `code`, create a code action command
		// .filter(diagnostic => diagnostic.code === POSSIBLE_THREAD_DIVERGENCE)
		return context.diagnostics
			.map(diagnostic => this.createCommandCodeAction(diagnostic));
	}

	private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more...', vscode.CodeActionKind.QuickFix);
		if (diagnostic.code == POSSIBLE_THREAD_DIVERGENCE) {
			action.command = { command: COMMAND_THREAD_DIVERGENCE, title: 'Learn more about CUDA thread divergence', tooltip: 'This will open an informational page about thread divergence.' };
		}else if (diagnostic.code == POSSIBLE_INACCURATE_ALLOCATION) {
			action.command = { command: COMMAND_INACCURATE_ALLOCATION, title: 'Learn more about CUDA memory allocation', tooltip: 'This will open an informational page about memory allocation.' };
		}else{
			action.command = { command: COMMAND, title: 'Learn more about [Text]', tooltip: 'This will open [Text].' };
		}
		action.diagnostics = [diagnostic];
		action.isPreferred = true;
		return action;
	}
}
