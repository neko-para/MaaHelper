import vscode from 'vscode'
import fs from 'fs'
import Jimp from 'jimp'
import path from 'path'

export class ImageClipper {
  panel: vscode.WebviewPanel
  context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext, dispose: () => void) {
    this.context = context
    this.panel = vscode.window.createWebviewPanel(
      'Maa ImageClipper',
      'Maa ImageClipper',
      vscode.ViewColumn.Active,
      {
        enableScripts: true
      }
    )

    this.panel.onDidDispose(dispose)

    fs.readFile(
      context.asAbsolutePath('assets/image-clipper/index.html'),
      'utf-8',
      (err, html) => {
        this.panel.iconPath = vscode.Uri.file(
          context.asAbsolutePath('assets/icon32.png')
        )
        this.panel.webview.html = html

        this.panel.webview.onDidReceiveMessage(e => {
          this.recv(e)
        })
      }
    )
  }

  recv(msg: any) {
    switch (msg.action) {
      case 'pull-image':
        fs.readFile(
          this.context.asAbsolutePath('assets/test.png'),
          (err, data) => {
            this.pushImage(data)
          }
        )
        break
      case 'save-image': {
        const { x, y, w, h, outputName } = msg
        fs.readFile(
          this.context.asAbsolutePath('assets/test.png'),
          (err, data) => {
            const dir = vscode.workspace.workspaceFolders?.[0].uri.fsPath
            if (dir) {
              let output = path.join(dir, outputName)
              fs.mkdirSync(path.dirname(output), { recursive: true })
              Jimp.read(data).then(img => {
                img.resize(1280, 720).crop(x, y, w, h).write(output)
              })
            }
          }
        )
      }
    }
  }

  post(msg: any) {
    this.panel.webview.postMessage(msg)
  }

  pushImage(img: Buffer) {
    this.post({
      action: 'push-image',
      image: img.toString('base64')
    })
  }
}
