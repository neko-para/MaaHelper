import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "maa-helper" is now active!')

  let disposable = vscode.commands.registerCommand(
    'maa-helper.helloWorld',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage('Hello World from Maa Helper!')
    }
  )

  context.subscriptions.push(disposable)
}

export function deactivate() {}
