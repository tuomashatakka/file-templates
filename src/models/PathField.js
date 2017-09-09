'use babel'
import React from 'react'
import { CompositeDisposable, Emitter, TextEditor } from 'atom'
import { extname, sep } from 'path'
import self from 'autobind-decorator'
import DisposableEvent from './DisposableEvent'
import List from '../views/components/ListComponent'

const _sep      = /(?:([/\\]+))/
const separator = new RegExp(_sep.source, 'g')

export default class PathField {

  constructor (path='') {

    this.subscriptions = new CompositeDisposable()
    this.editor        = new TextEditor({ mini: true })
    this.emitter       = new Emitter()
    this.extension     = extname(path)
    this.path          = resolvePath(path)

    const core = (name, handle, el) => {
      let element = el || this.element
      let handler = (ev) => {
        handle(ev)
        // ev.preventDefault()
        // return false
      }
      return new DisposableEvent(element, 'core:' + name, handler.bind(this))
    }

    const onBackspace = (ev) => {
      this.updatePath()
      ev.preventDefault()
      return false
    }

    this.subscriptions.add(
      this.editor.onDidStopChanging(this.update.bind(this)),
      core('cancel', this.cancel),
      core('confirm', this.confirm),
      core('move-up', this.navigate.bind(this, 'up')),
      core('move-down', this.navigate.bind(this, 'down')),
      core('focus-next', this.navigate.bind(this, 'right')),
      core('focus-previous', this.navigate.bind(this, 'left')),
      new DisposableEvent(this.element, 'keydown', ev =>
        ev.key === 'Backspace'
        && !this.text.length
        && onBackspace(ev)),
    )
  }

  navigate = (direction) => this.emitter.emit('move', direction)
  confirm  = () => this.emitter.emit('submit', this.getFullPath())
  cancel   = () => this.emitter.emit('cancel')

  getFullPath () {
    let path = [ ...this.path, this.text ]
      .filter(item => item.trim().length)
      .join(sep)
    if (!extname(path))
      path += sep
    return path
  }

  set text (text) {
    this.editor.setText(text)
    this.editor.moveToEndOfLine()
    this.update({})
    // input.selectToBeginningOfWord()
  }

  get text () {
    return this.editor.getText().trim()
  }

  get element () {
    return this.editor.editorElement
  }

  get entries () {
    let items = this.suggestions || []
    return items
  }

  get component () {
    return (
      <article className='path-field-container'>

        <nav ref={ref => ref && (this.breadcrumbs = ref)} />
        <section ref={this.attach} />

        <List
          items={this.entries}
          select={()=>console.warn('seletteed')}
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

  updatePath (fragment='') {
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
    this.emitter.emit('did-update-breadcrumbs', this.path)
  }

  updateList (...entries) {
    this.suggestions = entries
    this.emitter.emit('did-update-suggestions', this.suggestions)
  }

  @self
  attach (host) {
    host.appendChild(this.element)
    this.element.focus()
  }

  focus () {
    return this.editor.editorElement.focus()
  }

  update ({ changes }) {
    let text        = this.text
    let extension   = extname(text)

    const path = (updates) => {
      this.updatePath(updates)
      this.emitter.emit('did-insert-separator', this.path)
    }

    const ext = (extension) => {
      this.extension = extension
      this.emitter.emit('did-change-extension', extension)
    }

    const match = content =>
      content.match(separator)

    for (let { oldText, newText } of changes || [])
      if (match(newText) && !match(oldText))
        path(text)

    if (this.extension !== extension)
      ext(extension)
  }

  onDidUpdateSuggestions = callback => this.emitter.on('did-update-suggestions', callback)
  onDidUpdateBreadcrumbs = callback => this.emitter.on('did-update-breadcrumbs', callback)
  onDidInsertSeparator = callback => this.emitter.on('did-insert-separator', callback)
  onDidChangeExtension = callback => this.emitter.on('did-change-extension', callback)
  onNavigate = callback => this.emitter.on('move', callback)
  onSubmit   = callback => this.emitter.on('submit', callback)
  onCancel   = callback => this.emitter.on('cancel', callback)

  destroy () {
    this.editor.destroy()
    this.emitter.destroy()
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
