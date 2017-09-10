'use babel'

import React, { Component } from 'react'
import prop from 'prop-types'


const li = (contents, n) => <li key={n}>{contents}</li>


export default class DialogContents extends Component {

  static propTypes = {
    children: prop.array,
  }

  constructor (props) {

    super(props)

    this.state = {
      errors: [],
      listIsOpen: true,
    }
  }

  render () {

    let   { children } = this.props
    const { errors }   = this.state
    const errorsList   =
      <ul className='error-messages block padded'>
        {errors.map(li)}
      </ul>

    console.log(children)
    return (
      <div className='dialog-contents'>
        {errorsList}
        {children.map(c => {
          c.props.listIsOpen = this.state.listIsOpen
          return c
        })}
      </div>
    )
  }
}
