'use babel'

import Dialog from './views/NewFileDialog'

export let modals = {}

export const openModal = ({ name, value }) => {

  if (!modals[name])
    modals[name] = new Dialog(name)

  let modl = modals[name]
  let el = modl.panel.getElement()
  let boundFocus = focus.bind(modl)

  // If the click is inside the dialog's bounds,
  // do nothing. Otherwise, hide the dialog.
  let onClickAnywhere = (ev) => !isWithinBounds(el, ev) && blur(ev)

  let blur = () => {
    modl.hide()
    modl.value = ''
    document.removeEventListener('click', onClickAnywhere)
  }

  let open = () => {
    modl.value = value
    boundFocus()
    document.addEventListener('click', onClickAnywhere, true)
  }

  open()
  return modl
}


function focus () {
  this.show()
  this.input.element.focus()
}


function isWithinBounds (el, { clientX: x, clientY: y }) {

  // Assert click is inside boundaries
  let { left, top, width, height } = el.getBoundingClientRect()
  return (
    x < left + width &&
    x > left &&
    y < top + height &&
    y > top
  )
}
