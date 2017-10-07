'use babel'

import prop from 'prop-types'
import React, { Component } from 'react'
import { render } from 'react-dom'
import { CompositeDisposable } from 'atom'

import { manager, getTemplates } from '../models/TemplateManager'
import SettingsGeneralPanel from './SettingsGeneralPanel'
import Dialog from './NewFileDialog'
import List from './components/ListComponent'


let onModalBlur = modal => ({ clientX: x, clientY: y }) => {
  // Assert click is inside boundaries
  let { left, top, width, height } = modal.panel.getElement().getBoundingClientRect()
  if (x < left + width &&
      x > left &&
      y < top + height &&
      y > top)
    return

  // If the click is outside dialog, hide it
  modal.hide()
  document.removeEventListener('click', onModalBlur)
}

const onWillAddTemplate = () => {
  let uri     = manager.directory.path
  let modal   = new Dialog('new-template')
  modal.value = uri
  document.addEventListener('click', onModalBlur(modal))
  modal.show()
}

// const REGEX = { VISIBLE: /display:(?:\s*)(block)/ig }


export default class SettingsTemplatePanel extends Component {

  static propTypes = {
    toolbar: prop.array,
    name:    prop.string,
    icon:    prop.string,
    host:    prop.object,
  }

  constructor (props) {
    super(props)
    this.name = props.name
    this.icon = props.icon
    this.subscriptions = new CompositeDisposable()
    this.state = {
      templates: getTemplates()
    }
  }

  static create (props={}) {

    let host           = SettingsGeneralPanel()
    let ComponentClass = this
    let instance       = <ComponentClass {...props} host={host} />
    let component      = render(instance, host.element)
    return new Proxy(
      component, {
        get: (obj, attr) => obj[attr] || host[attr] || null
      })
  }

  destroy () {
    this.props.host.destroy()
    this.subscriptions.dispose()
    this.element.remove()
  }

  render () {
    let templates = manager.all.map(item => item.selected = () => false)

    return (

      <section className='section settings-panel'>

        <div className={`block section-heading icon icon-${this.icon}`}>
          {this.name}
        </div>

        <button
          onClick={onWillAddTemplate}
          className='btn'>
          <span className='icon icon-plus' /> Add template
        </button>

        {this.props.children}

        <h2 className='block'>Template files</h2>

        <List
         items={templates}
         select={item => atom.workspace.open(item.path)}
         displayToggleButton={false} />

       <h2 className='block'>Template constants</h2>

    </section>

    )
  }
}
