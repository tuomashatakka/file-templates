'use babel'
//@flow


import {
  CompositeDisposable, Disposable,
  Directory, File, Emitter, TextEditor
} from 'atom'

import React from 'react'
import self from 'autobind-decorator'
import { extname, basename, sep } from 'path'
import DisposableEvent from './DisposableEvent'
import List from '../views/components/ListComponent'
import DynamicDirectory from './Directory'
import type { Direction, UpdatePropertiesType } from '../../types/generic.type'
const _sep      = /(?:([/\\]+))/
const _parent   = /^([^.]*?\.{2,})/
const separator = new RegExp(_sep.source, 'g')
const parent    = new RegExp(_parent.source)

export default class PathField {

  suggestions: Array<string>
  path: Array<string>
  extension: string

  breadcrumbs: HTMLElement
  editor: TextEditor
  emitter: Emitter
  subscriptions: CompositeDisposable


  constructor (path: string = '') {

    const onBackspace = () => this.popPath()
    const core = (name, handle: Function, el: HTMLElement) => {
      let element = el || this.element
      let handler = () => handle()
      // ev.preventDefault()
      // return false
      return new DisposableEvent(element, 'core:' + name, handler.bind(this))
    }
    let cnfrm = e => {
      if (e)
        e.preventDefault()
      this.confirm()
      return false
    }

    this.subscriptions = new CompositeDisposable()
    this.editor        = new TextEditor({ mini: true })
    this.emitter       = new Emitter()
    this.extension     = extname(path)
    this.path          = resolvePath(path)
    this.currentDirectory = new DynamicDirectory(this.serialize())

    this.update().then(() => {
      this.currentDirectory = new DynamicDirectory(this.serialize())
    })

    let sub: Disposable = this.editor.onDidStopChanging.call(this.editor, this.update.bind(this))
    let observeBackspace = new DisposableEvent(this.element, 'keydown', ev => {
      if (ev.key === 'Backspace' && this.empty) {
        ev.preventDefault()
        onBackspace()
        return false
      }
    })

    this.subscriptions.add(
      sub,
      core('cancel', this.cancel),
      core('confirm', cnfrm),
      core('move-up', this.navigate.bind(this, 'up')),
      core('move-down', this.navigate.bind(this, 'down')),
      core('focus-next', this.navigate.bind(this, 'right')),
      core('focus-previous', this.navigate.bind(this, 'left')),
      observeBackspace
    )
  }

  get empty () { return this.text.length === 0 }

  navigate = (direction: Direction) => this.emitter.emit('move', direction)
  confirm  = () => this.emitter.emit('submit', this.serialize())
  cancel   = () => this.emitter.emit('cancel')

  getFullPath () {
    let path = [ ...this.path, this.text ]
      .filter(item => item.trim().length)
      .join(sep)
    if (!(extname(path) || this.text.trim()))
      path += sep
    return path
  }

  serialize () {
    let raw = this.getFullPath()
    let fullPath = atom.project.resolvePath(raw)
    console.warn(raw, fullPath)
    if (fullPath.endsWith(sep))
      return new Directory(fullPath)
    return new File(fullPath)
  }

  set text (text: string = '') {
    if (typeof text !== 'string')
      throw new TypeError(`PathField.text setter takes only string parameters. Got ${typeof text} instead.`)
    this.editor.setText(text)
    this.editor.moveToEndOfLine()
    this.update()
    // input.selectToBeginningOfWord()
  }

  get text (): string {
    return this.editor.getText().trim()
  }

  get element (): HTMLElement {
    return this.editor.getElement()
  }

  get entries (): Array<string> {
    let items = this.suggestions || []
    console.log('entries', items)
    return items
  }

  get component (): any {
    return this._component || (this._component =
      <article className='path-field-container'>

        <nav ref={ref => ref && (this.breadcrumbs = ref)} />
        <section ref={ref => ref && this.attach(ref)} />

        <List
          items={this.entries}
          select={(item) => {
            console.warn('seletteed', item)
            this.updatePath(item.name)
          }}
          onDidChange={fn => this.onDidUpdateSuggestions(fn)}
          displayToggleButton={false}
        />
      </article>
    )
    // <ol className='select-list list-group hidden' ref={ref => ref && (this.list = ref)}>
    //   {(this.entries || []).map(item => <li>
    //
    //   </li>)}
    // </ol>
  }

  popPath () {
    if (this.path.length)
      this.updatePath()
  }

  updatePath (fragment: string = '') {
    let text
    let fragments = fragment
      .split(separator)
      .map(item => item.replace(separator, ''))
      .filter(item => item.trim().length)

    if (!fragments.length)
      text = this.path.pop()

    else {
      this.path.push(...fragments)
      text = ''
    }

    const createPathFragment = (content) => {
      let el = document.createElement('span')
      let index = this.breadcrumbs.children.length

      el.textContent = content
      el.addEventListener('click', () => {
        this.path.splice(index + 1)
        Array
          .from(this.breadcrumbs.children)
          .forEach((item, n) => n > index ? item.remove() : null)
        this.updatePath()
      })

      this.breadcrumbs.appendChild(el)
    }

    this.text = text
    this.breadcrumbs.innerHTML = ''
    this.path.forEach(path => createPathFragment(path))
    this.currentDirectory.setPath(this.serialize())
    this.emitter.emit('did-update-breadcrumbs', this.path)
    this.emitter.emit('did-update', this.currentDirectory)
  }

  updateList (...entries: Array<string>) {
    this.suggestions = this.currentDirectory.dirnames.map(name => ({
      name,
    }))
    console.log("this.suggestions", this.suggestions)
    this.emitter.emit('did-update-suggestions', this.suggestions)
  }

  // updateList (...entries: Array<string>) {
  //   this.suggestions = entries
  //   this.emitter.emit('did-update-suggestions', this.suggestions)
  // }
  //
  @self
  attach (host: HTMLElement) {
    host.appendChild(this.element)
    this.element.focus()
  }

  focus () {
    return this.editor.getElement().focus()
  }

  async update (state: UpdatePropertiesType): Promise<any> {
    let text        = this.text
    let extension   = extname(text)

    if (!state)
      return

    const ext = (extension) => {
      this.extension = extension
      this.emitter.emit('did-change-extension', extension)
    }

    const match = content =>
      content.match(separator)

    const matchUp = content =>
      content.match(parent)

    for (let { oldText, newText } of state.changes || []) {
      if (matchUp(newText)) {
        this.popPath()
        this.emitter.emit('did-remove-separator', this.path)
        break
      }
      if (match(newText) && !match(oldText)) {
        this.updatePath(text)
        this.emitter.emit('did-insert-separator', this.path)
      }
    }

    if (this.extension !== extension)
      ext(extension)
  }

  onDidUpdate             = (callback: () => Disposable) => this.emitter.on('did-update', callback)
  onDidUpdateSuggestions  = (callback: () => Disposable) => this.emitter.on('did-update-suggestions', callback)
  onDidUpdateBreadcrumbs  = (callback: () => Disposable) => this.emitter.on('did-update-breadcrumbs', callback)
  onDidInsertSeparator    = (callback: () => Disposable) => this.emitter.on('did-insert-separator', callback)
  onDidChangeExtension    = (callback: () => Disposable) => this.emitter.on('did-change-extension', callback)
  onNavigate              = (callback: () => Disposable) => this.emitter.on('move', callback)
  onSubmit                = (callback: () => Disposable) => this.emitter.on('submit', callback)
  onCancel                = (callback: () => Disposable) => this.emitter.on('cancel', callback)

  destroy () {
    this.editor.destroy()
    this.emitter.dispose()
    this.subscriptions.dispose()
  }


}

function resolvePath (path) {
  if (typeof path === 'string')
    return path.split(sep)
  if (path instanceof Array)
    return path
  throw new TypeError(`Invalid path given for PathField: <${typeof path}> ${path}`)
}
