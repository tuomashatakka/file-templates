'use babel'
/**
 * Common template functions
 *
 * @module templates
 */


import { statSync } from 'fs'
import { Directory, File } from 'atom'
import { join, extname, basename } from 'path'
import { TMPL_DIR_NAME } from '../constants'
import Template from './Template'


export const formatTemplate = ({ path }) => ({
  path,
  icon:     ftype(path),
  type:     extname(path)  || 'directory',
  name:     basename(path) || 'unnamed',
  template: new Template({ path, icon: ftype(path) }),
  selected: () => false })

export const getNullTemplateItem = selected => ({
  name: 'No template',
  icon: 'x',
  path: null,
  type: null,
  selected: (typeof selected === 'function' ? selected() : selected) || false
})

const ftype = path => statSync(path) ? 'file' : 'file-directory'

export const getTemplates = (filter=()=>true) => manager.all.filter(filter)

export const compareTemplates = (a, b) => a && b && a.path === b.path

let _entries, _cached


export default class TemplateManager {

  constructor (dirname=TMPL_DIR_NAME) {
    const path      = join(atom.configDirPath, 'storage', dirname)
    this.directory  = getDirectory(path)
  }

  getTemplate (name) {
    let item = this.getFile(name)
    if (!item)
      return new Template()
    return new Template(item)
  }

  get entries () {
    if (!_entries)
      _entries = this.directory.getEntriesSync()
    return [ ..._entries ]
  }

  get all () {
    if (!_cached)
      _cached = this.entries.map(templateForEntry)
    return [ ..._cached ]
  }

  getByPosition (n) {
    n = Math.min(Math.max(n, 0), this.all.length - 1)
    return this.all[n]
  }


  getByExtension (ext) {
    if (ext)
      return this.all.filter(item => item.path.endsWith(ext))
    return []
  }

  has (fname) {
    return this.entries.find(template =>
      template.path.endsWith(fname))
  }

  getFile (fname) {
    if (!fname)
      return null
    if (this.has(fname))
      return this.directory.getFile(
        (fname.startsWith(this.directory.path))
        ? fname.substr(this.directory.path.length)
        : fname)
    return false
  }

  add (name, contents) {
    if (this.has(name))
      return false
    this.set(name, contents)
  }

  set (name, contents=null) {
    let path = join(this.directory.path, name)
    let file = new File(path)
    file.create()
    if (contents)
      file.write(contents)
  }

  toJSON = () =>
    this.getAll()

  toString = () =>
    this.getAll().map(entry => entry.name)

}

export let manager = new TemplateManager()


function templateForEntry (entry) {
  let { path } = entry
  let icon     = [ 'file' ]

  if (extname(path))
    icon.push('directory')
  icon = icon.join('-')
  return new Template({ path, icon })
}


function getDirectory (path) {
  let dir = new Directory(path)
  dir.exists().then(exists =>
    !exists && dir.create())
  return dir
}
