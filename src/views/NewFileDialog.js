'use babel'

import React from 'react'
import { render } from 'react-dom'
import { Disposable, CompositeDisposable } from 'atom'
import PathField from '../models/PathField'
import { dir } from '../utils'
import { manager } from '../models/TemplateManager'
import Template from '../models/Template'
import Toolbar from './components/ToolbarComponent'
import List from './components/ListComponent'
import DialogContents from './components/DialogContents'
import BaseDialog from './components/Dialog'


export default class Dialog extends BaseDialog {

  constructor (name) {
    super({ name })

    this.errors        = []
    this.name          = name
    this.className     = `filepath-prompt modal-${this.name}`
    this.subscriptions = new CompositeDisposable()

    // manager.add('index_with_content.js', 'kikki hiir on [[pelle]]')

    const navigateTemplatesList = direction => {
      if (direction === 'down')
        this.selectNextTemplate()
      else if (direction === 'up')
        this.selectPreviousTemplate()
    }

    let input = this.input
    input.onNavigate(navigateTemplatesList)
    input.onSubmit(this.submit.bind(this))
    input.onCancel(this.hide.bind(this))
    input.onDidUpdateSuggestions(this.render.bind(this))
    input.onDidChangeExtension(this.getTemplatesByExtension.bind(this))


    this.render()
  }

  getTitle = () => this.name

  show () {
    this.errors = []
    this.selectedTemplate = null
    this.panel.show()
    console.info("selectedTemplate", this.selectedTemplate, this)
  }

  hide () {
    this.panel.hide()
  }

  destroy () {
    this.input.destroy()
    this.subscriptions.dispose()
  }

  get input () {
    return this.panel.input
  }

  get panel () {
    if (this._panel)
      return this._panel
    let { className, getTitle } = this
    let item       = document.createElement('article')
    let disposable = new Disposable(() => this._panel.destroy())

    this._panel = atom.workspace.addModalPanel({ item, getTitle, className, })
    this._panel.input = new PathField()
    this._panel.hide()
    this.subscriptions.add(disposable)
    return this._panel
  }

  set value (text) {
    this.input.path = []
    this.input.text = dir(text)
  }

  get value () {
    return this.input.text
  }

  get absoluteValue () {
    return this.input.getFullPath()
  }

  addError (err) {
    this.errors.push(err)
    this.component.setState({ errors: this.errors })
  }

  async submit () {
    this.errors = []
    let vn = this.input.serialize()

    let open = () => {
      if (vn.isFile())
        atom.workspace.open(vn.getRealPathSync())
      else if (vn.isDirectory()) {
        vn.create()
        this.panel.hide()
      }
    }

    try {

      // If the given path already exists, do not overwrite it
      // but rather display an error.
      if (vn.existsSync()) {
        this.addError(`${vn.path} already exists`)
        open()
      }

      // If the input ends with a path separator, create a new
      // directory to the given location.
      else if (vn.isDirectory()) {
        open()
      }

      // If the input evaluates to a filename (it does not end
      // with a separator character), open a new pane item for
      // the given input as the path for the item. If a template
      // is selected, apply it to the newly opened pane item.
      else {
        let resolver = atom.workspace.open(vn.path)
        if (this.selectedTemplate) {
          let editor = await resolver
          this.selectedTemplate.apply(editor)
          console.info("selectedTemplate", this.selectedTemplate)
        }
        this.panel.hide()
      }
    }

    catch({ message }) {
      this.addError(message)
    }
  }

  get templates () {
    return manager
  }

  getTemplatesByExtension (ext='') {
    let items = []
    if (ext.length > 1)
      items = manager.getByExtension(ext)
    this.input.updateList(...items)
  }

  get noTemplate () {
    return {
      name: 'No template',
      icon: 'icon-x',
      path: null,
      type: null,
      selected: !this._selectedTemplate ? true : false
    }
  }

  get selectedTemplate () { return this._selectedTemplate || this.noTemplate }
  set selectedTemplate (item) { this._selectedTemplate = item || null }

  selectNextTemplate () {
    let { path } = this.selectedTemplate
    let pos = manager.all.findIndex(item => item.path == path)
    if (pos === -1 && path)
      return this.setTemplate(null)
    return this.selectTemplateByPosition(pos + 1)
  }

  selectPreviousTemplate () {
    let { path } = this.selectedTemplate
    let pos = manager.all.findIndex(o => o.path == path)
    if (pos < 1 || !path)
      return this.setTemplate(null)
    return this.selectTemplateByPosition(pos - 1)
  }

  selectTemplateByPosition (pos) {
    let item = manager.getByPosition(pos)
    return this.setTemplate(item)
  }

  setTemplate (item) {
    if (!(item === null || item instanceof Template))
      throw new TypeError(`Invalid argument passed to setTemplate function - function expected either null or a Template instance`)
    this.selectedTemplate = item
    this.render()
    return item
  }

  get templatesList () {
    let { noTemplate, templates } = this
    let isSelected = item => Object.assign(item, { selected: item.path === this.selectedTemplate.path })
    templates = templates.all.map(isSelected)
    templates.unshift(noTemplate)
    return templates
  }

  render () {
    let onSelect = (item) => this.setTemplate(item.path === null ? null : item)
    let buttons   = [
      { text: 'Cancel',   action: () => this.hide() },
      { text: 'Save',     action: () => this.submit(), style: 'success' },
      { text: 'Template', action: () => {
        this.listIsOpen = !this.listIsOpen
        this.component.setState({ listIsOpen: this.listIsOpen })
        this.render()
      }, icon: 'chevron-right' }
    ]

    this.component = render(
      <DialogContents>
        {this.input.component}
        <Toolbar buttons={buttons} />

        <List
          isOpen={this.listIsOpen}
          items={this.templatesList}
          select={onSelect} />
      </DialogContents>,
      atom.views.getView(this.panel)
    )
  }

}
