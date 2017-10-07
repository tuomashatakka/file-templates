'use babel'

import SettingsPanel from './views/SettingsTemplatePanel'
import { CompositeDisposable } from 'atom'
import { manager } from './models/TemplateManager'
import { getSelection, stopFurtherDispatching } from './utils'
import { openModal } from './ViewManager'

let subscriptions
let commands = {}
let observedCommands = []
let active = {
  uri:   null,
  title: null,
}

export const observeCommand = (namespace, callback) => {
  observedCommands.push(namespace)
  commands[namespace] = callback
  return atom.commands.onWillDispatch(
    event => {
      let isRegistered = -1 !== observedCommands.indexOf(event.type)
      if (isRegistered)  {
        atom.notifications.addInfo('Halting the default dispatch execution')
        return stopFurtherDispatching(callback(event))
    }}
  )
}

export const onWillAddNewFile = (e) => {
  let name  = 'new-file'
  let value = getSelection() || active.uri
  openModal({ name, value })
  atom.notifications.addInfo("onWillAddNewFile called with value " + value)
  return e
}


export const onWillAddNewTemplateFile = () => openModal({
  name: 'new-template-file',
  value: manager.path,
})

// const onFileSave = (e) => {
//   let uri = atom.workspace.getActivePaneItem().getURI()
// }


export const subscribe = () => {
  subscriptions = new CompositeDisposable()
  subscriptions.add(
    changeTabSubscription(),
    observeCommand('application:new-file', onWillAddNewFile),
    onChangeTab()
  )
  return subscriptions
}

export const dispose = () => subscriptions.dispose()

export const onChangeTab = () =>
  atom.workspace.observeTextEditors((item) => {
    if (item.isEmpty && !item.isEmpty())
      active = {
        el:    item.getElement(),
        uri:   item.getURI ? item.getURI() : null,
        save:  p => item.saveAs(p),
        title: item.getTitle(),
      }
    else
      return false

  })


export const changeTabSubscription = () =>
  atom.workspace.observePaneItems((item: any) => {
    if (item.constructor.name !== 'SettingsView')
      return
    let name = 'File Templates'
    let icon = 'file-directory'
    let panel = SettingsPanel.create({
      name,
      icon,
      toolbar: [
        {
          text:   'Add Template',
          icon:   'plus',
          style:  'info',
          action: () => onWillAddNewTemplateFile(),
        }
      ],
    })
    // element.innerHTML = '<h3>' + title + '</h3>'
    item.addCorePanel(panel.name, panel.icon, () => panel)
  })


// this.subscriptions.add(onAddTab)
// observeCommand('core:save', onFileSave)
// const onAddTab = atom.workspace.onDidAddTextEditor(({ item }) => {
//     pending = item
//     if (item.isEmpty && item.isEmpty() && item.getURI && !item.getURI())
//       return false
// })
