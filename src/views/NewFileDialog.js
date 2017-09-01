'use babel'
import React, { Component } from 'react'
import { render } from 'react-dom'
import { Disposable, CompositeDisposable, Directory } from 'atom'
import { join, sep } from 'path'
import PathField from '../models/PathField'
import { existsSync } from 'fs'
import { templateManager } from '../templates'
import Template from '../models/Template'
import { bindDisposableEvent, bindControlKeys, bindNavigationKeys, dir } from '../utils'
import Toolbar from './components/ToolbarComponent'
import List from './components/ListComponent'


class DialogContents extends Component {

  constructor (props) {
    super(props)
    this.state = {
      errors: [],
    }
  }

  render () {
    let { children } = this.props
    return <div>
      <div className='alert text-error'>
        {this.state.errors.map((err, n) => <p key={n}>{err}</p>)}
      </div>
      {children}
    </div>
  }
}


export default class Dialog {

  constructor (name) {

    this.errors        = []
    this.name          = name
    this.className     = `filepath-prompt modal-${this.name}`
    this.subscriptions = new CompositeDisposable()

    this.templates.add('index_with_content.js', 'kikki hiir on [[pelle]]')
    this.render()

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
  }

  getTitle = () => this.name

  show () {
    this.errors = []
    this.selectedTemplate = null
    this.panel.show()
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

  addError (err) {
    this.errors.push(err)
    this.component.setState({ errors: this.errors })
  }

  submit () {
    this.errors = []
    let path = this.value

    if (path && path[0] !== sep)
      path = join(atom.project.getPaths()[0], path)

    try {

      // If the given path already exists, do not overwrite it
      // but rather display an error.
      if (existsSync(path)) {
        this.addError(`${path} already exists`)
        if (!path.endsWith(sep))
          atom.workspace.open(path)
      }

      // If the input ends with a path separator, create a new
      // directory to the given location.
      else if (path.endsWith(sep)) {
        (new Directory(path)).create()
        this.panel.hide()
      }

      // If the input evaluates to a filename (it does not end
      // with a separator character), open a new pane item for
      // the given input as the path for the item. If a template
      // is selected, apply it to the newly opened pane item.
      else {
        let resolver = atom.workspace.open(path)
        if (this.selectedTemplate)
          resolver.then(editor => this.selectedTemplate
            ? this.selectedTemplate.apply(editor)
            : null)
        this.panel.hide()
      }
    }

    catch({ message }) {
      this.addError(message)
    }
  }

  get templates () {
    return templateManager()
  }

  getTemplatesByExtension (ext='') {
    let items = []
    console.log('extension updated', ext)
    if (ext.length > 1)
      items = this.templates.getByExtension(ext)
    console.log('extension updated', ...items)
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
    let pos = this.templates.all.findIndex(item => item.path == path)
    if (pos === -1 && path)
      return this.setTemplate(null)
    return this.selectTemplateByPosition(pos + 1)
  }

  selectPreviousTemplate () {
    let { path } = this.selectedTemplate
    let pos = this.templates.all.findIndex(o => o.path == path)
    if (pos < 1 || !path)
      return this.setTemplate(null)
    return this.selectTemplateByPosition(pos - 1)
  }

  selectTemplateByPosition (pos) {
    let item = this.templates.getByPosition(pos)
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
    let onSelect = (item) => this.setTemplate(item)
    let buttons   = [
      { text: 'Cancel', action: () => this.hide() },
      { text: 'Save',   action: () => this.submit(), style: 'success' }
    ]

    this.component = render(
      <DialogContents>
        {this.input.component}
        <Toolbar buttons={buttons} />
        <List
          items={this.templatesList}
          select={onSelect} />
      </DialogContents>,
      atom.views.getView(this.panel)
    )
  }

}
