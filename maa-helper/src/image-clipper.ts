import vscode from 'vscode'
import fs from 'fs'
import Jimp from 'jimp'
import path from 'path'
import { exec } from 'child_process'
import { tmpdir } from 'os'

export class ImageClipper {
  panel: vscode.WebviewPanel
  context: vscode.ExtensionContext
  image_path: string
  image: Buffer | null

  constructor(context: vscode.ExtensionContext, dispose: () => void) {
    this.context = context
    this.image_path = path.join(tmpdir(), 'maahelper', '1.png')
    fs.mkdirSync(path.dirname(this.image_path), { recursive: true })
    this.image = null
    console.log(this.image_path)
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
      case 'pull-image': {
        const helper_path =
          vscode.workspace.getConfiguration('maahelper').get('path') ??
          'maahelper'
        exec(`${helper_path} "${this.image_path}"`, err => {
          if (err) {
            vscode.window.showErrorMessage(JSON.stringify(err))
          } else {
            fs.readFile(this.image_path, (err, data) => {
              this.image = data
              this.pushImage()
            })
          }
        })
        break
      }
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

  pushImage() {
    if (!this.image) {
      return
    }
    this.post({
      action: 'push-image',
      image: this.image.toString('base64')
    })
  }
}
