'use babel'
import { readdirSync, statSync } from 'fs'
import { resolve, basename } from 'path'


export default class Directory {

  constructor (path='.') {
    if (typeof path === 'object' &&
        typeof path.getPath === 'function')
      path = path.getPath()
    this.basePath = resolve(path)
  }

  static from (path) {
    try {
      return new Directory(path)
    }
    catch (e) {
      return null
    }
  }

  get filenames () {
    let map = (name) => basename(name)
    return this.files.map(map)
  }

  get dirnames () {
    let map = (dir) => basename(dir.path)
    return this.directories.map(map)
  }

  get files () {
    if (!this._files)
      this._files = this.ls.filter(isFile)
    return this._files
  }

  get directories () {
    if (!this._directories)
      this._directories = this.ls
        .filter(isDirectory)
        .filter(exists)
        .map(Directory.from)
    return this._directories
  }

  get ls () {
    if (!this._items) {
      let toAbsolutePath = (item) => resolve(this.path, item)

      try {
        let items = this._items || readdirSync(this.path)
        this._items = items.map(toAbsolutePath)
      }
      catch(error) {
        // TODO: Better error handling
        console.warn(error)
        return this._items || []
      }
    }
    return this._items
  }

  get path () {
    let path = this._path || this.basePath
    return resolve(path)
  }

  set path (path='.') {
    if (typeof path === 'object' &&
        typeof path.getPath === 'function')
      path = path.getPath()
    this._path  = resolve(this._path, path)
    this._items = null
    this._files = null
    this._directories = null
  }

  setPath (path) {
    if (!path)
      throw new TypeError(`Empty path passed as an argument for a call to Explorer.setPath`)
    this.path = path
  }

  resetPath () {
    this.path = this.basePath
  }

}

export function stringOrNull (props, propName, componentName) {
  let provided = props[propName]
  let isNull = provided === null
  let isString = typeof provided !== 'string'
  if (!isNull && !isString)
    return new Error(`Invalid prop \`${propName}\` supplied to \`${componentName}\`. Validation failed.`)
}

export const isDirectory = (item) =>
  statSync(item).isDirectory()

export const isFile = (item) =>
  statSync(item).isFile()

export const exists = (item) =>
  typeof item !== 'undefined' &&
  item !== null &&
  item !== '' &&
  item !== 0
