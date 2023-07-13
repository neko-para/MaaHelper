import * as vscode from 'vscode'
import { ImageClipper } from './image-clipper'

export function activate(context: vscode.ExtensionContext) {
  console.log('Maa helper loaded!')
  let imageClipper: ImageClipper | null = null
  context.subscriptions.push(
    vscode.commands.registerCommand('maa-helper.open-clipper', () => {
      console.log('command triggered')

      if (!imageClipper) {
        imageClipper = new ImageClipper(context, () => {
          imageClipper = null
        })
      }
    })
  )
}

export function deactivate() {}
