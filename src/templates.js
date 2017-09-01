'use babel'

import { Directory, File } from 'atom'
import { join, extname } from 'path'
import Template from './models/Template'


let _entries, _cached


export default class TemplateInterface {

  constructor () {
    const dirname   = 'file-templates'
    const path      = join(atom.getStorageFolder().getPath(), dirname)
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
}


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


let templateInterface
export const templateManager = () =>
  templateInterface
  ? templateInterface
  : templateInterface = new TemplateInterface()
