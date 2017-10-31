'use babel'

import React from 'react'
import prop from 'prop-types'
import { icon } from '../../utils'


/**
 * Utility function for the toggle button
 * to toggle the hidden class for the immediate
 * next sibling of the button.
 *
 * @method toggleNext
 * @param  {HTMLElement} target
 */

const toggleNext = ({ target: el }) => {
  el.parentElement.classList.toggle('collapsed')
  el.parentElement.classList.toggle('expanded')
  el.nextElementSibling.classList.toggle('hidden')
}


const style = {
  clear: 'both',
  width: 'auto',
  // top: '-1.5rem',
  // right: 0,
  // left: 0,
  // position: 'relative'
}

class List extends React.Component {
  constructor({ items, onDidChange }) {
    super (...arguments)
    this.state = { items }
    if (typeof onDidChange === 'function')
      onDidChange(items => this.setState({ items }))
  }
  render () {
    let { select, observer, isOpen=true } = this.props
    let items = this.state.items
    let openState = isOpen ? ' expanded' : ' collapsed'

    return <div className={'file-templates-list' + openState}>

      <ol className={'select-list list-group' + openState} style={style}>

        {items.map(item => {

          let { name: key, selected, icon: ico } = item
          let iconElement   = <i className={ico ? `icon icon-${ico}` : icon(item)} />
          let labelElement  = <span className='title'>{key}</span>

          selected = typeof selected === 'function' ? selected(item) : selected || false
          let className = [ 'list-item', selected ? ' selected' : '', ].join(' ')
          let onClick = () => select(item)

          return <li key={key} onClick={onClick} className={className}>
            {iconElement}
            {labelElement}
          </li>
        })}

      </ol>
    </div>
  }
}


// Prop types for the `List` component
export default List
List.propTypes = {
  displayToggleButton: prop.bool,
  actions: prop.array,
  select: prop.func,
  items: prop.array,
}
