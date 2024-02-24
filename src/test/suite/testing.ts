import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "chatgpt-extension" is now active!');

  let chatGptDisposable = vscode.commands.registerCommand('SmartCoder.chatGpt', async () => {
    const input = await vscode.window.showInputBox({ prompt: 'Enter your message' });
    if (!input) {
      return;
    }

    try {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Calling ChatGPT API',
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0 });

        const apiKey = getApiKey();
        if (!apiKey) {
          vscode.window.showErrorMessage('Please set the API key for ChatGPT before using this command.');
          return;
        }

        const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-003/completions', {
          prompt: input,
          max_tokens: 1000,
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        const result = response.data.choices[0].text.trim();

        const panel = vscode.window.createWebviewPanel(
          'chatGPTResult',
          'ChatGPT Result',
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          }
        );

        panel.webview.html = `
          <pre><code>${escapeHtml(result)}</code></pre>
        `;
      });
    } catch (error) {
      vscode.window.showErrorMessage('An error occurred while fetching the result from ChatGPT API.');
      console.error(error);
    }
  });

  let generateTestCaseDisposable = vscode.commands.registerCommand('SmartCoder.generateTestCase', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor found.');
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select a method to generate a test case.');
      return;
    }

    const methodName = document.getText(selection).trim();

    try {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Test Case',
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0 });

        const apiKey = getApiKey();
        if (!apiKey) {
          vscode.window.showErrorMessage('Please set the API key for ChatGPT before using this command.');
          return;
        }

        const response = await axios.post('https://api.openai.com/v1/engines/davinci/completions', {
          prompt: `Generate a test case for the method ${methodName}.`,
          max_tokens: 1000,
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        const result = response.data.choices[0].text.trim();

        // ...process the generated test case result...
      });
    } catch (error) {
      vscode.window.showErrorMessage('An error occurred while generating the test case.');
      console.error(error);
    }
  });

  let setApiKeyDisposable = vscode.commands.registerCommand('SmartCoder.setApiKey', async () => {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your ChatGPT API key',
      ignoreFocusOut: true,
    });

    if (apiKey) {
      vscode.workspace.getConfiguration().update('SmartCoder.apiKey', apiKey, true);
      vscode.window.showInformationMessage('ChatGPT API key has been set successfully.');
    }
  });

  context.subscriptions.push(chatGptDisposable, generateTestCaseDisposable, setApiKeyDisposable);
}

function escapeHtml(unsafe: string): string {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration().get('SmartCoder.apiKey');
}
