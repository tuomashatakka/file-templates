'use babel'


// Regular expression for resolving placeolders in a template
export const placeholderQuery    = /\[\[([\w-_\.]+)\]\]/im

// Support regex for the end matcher of the placeholder
export const placeholderEndQuery = /\]\]/im



// Keys that should generally resolve to a submission event
export const ADVANCE_KEYS  = ['Enter', 'Tab']

// Keys that cancel the current action and close the related UI element(s)
export const CANCEL_KEYS   = ['Esc', ]



// Error messages for different kinds of errors
export const ERROR = {

  OVERRIDING_EDITOR: `
  ~ Mimic the Black Mesa's hand scanner voice ~

    Access Denied

  Seriously. There is no point in what you're trying to do.
  Do something else.
  Ideas:
   - Go play tag outside`,


  PANEL_COMPONENT_RENDER: `Classes extending BasePanelComponent should
  implement a render method that will return valid JSX. Please see React's
  manual for additional information.`,

}
