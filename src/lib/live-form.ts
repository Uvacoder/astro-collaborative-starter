import { customElement, property } from 'lit/decorators.js'
import { LiveObjectClass } from './utils/LiveObjectClass'
import { html, PropertyValues } from 'lit'
import globals from '../globals'
import { LiveObject } from '@liveblocks/client'

export const tagName = 'live-form'

// These elements are watching for input events
const watchedInputs = ['input', 'select', 'textarea']

@customElement(tagName)
export class MyElement extends LiveObjectClass {
  @property({ reflect: true })
  name

  @property()
  visible = false

  connectedCallback () {
    super.connectedCallback()
  }

  whenLiveObjectReady () {
    super.whenLiveObjectReady()

    this.updateInputs(this.LiveObject)
    globals.room.subscribe(this.LiveObject, (obj: LiveObject) => {
      this.updateInputs(obj)
    })
    this.visible = true
  }

  updateInputs (obj: LiveObject) {
    Object.entries(obj.toObject()).map(([key, val]) => {
      const selector = watchedInputs.map(sel => `${sel}[name=${key}]`).join(', ')
      const elements = this.querySelectorAll(selector)
      elements.forEach((element: HTMLInputElement) => {

        const oldVal = getInputValue(element)
        if (oldVal !== val.value) {
          setInputValue(element, val.value)
        }

        if (val.focus) {
          element.style.outline = `2px solid ${val.focus.color}`
          element.style.outlineOffset = `0px`
        } else {
          element.style.outline = 'none'
        }

      })
    })
  }

  protected firstUpdated (changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties)
    const selector =  watchedInputs.map(sel => `${sel}[name]`).join(', ')
    const inputs = this.querySelectorAll(selector)

    const onAnyChange = ({ target }) => {
      if (!this.LiveObject) {
        return
      }

      this.LiveObject.set(target.name, { type: target.type, value: getInputValue(target) || '' })
    }

    const onFocus = ({ target }) => {
      if (!this.LiveObject) {
        return
      }

      const { connectionId } = globals.room.getSelf()
      const user = { ...globals.room.getPresence(), id: connectionId }
      globals.room.batch(() => {
        const rest = this.LiveObject.get(target.name)
        this.LiveObject.set(target.name, { ...rest, focus: user })
      })
    }

    const onBlur = ({ target }) => {
      if (!this.LiveObject) {
        return
      }

      globals.room.batch(() => {
        const user = globals.room.getPresence()
        const { connectionId } = globals.room.getSelf()
        console.log(self)
        const current = this.LiveObject.get(target.name)
        if (current?.focus && current.focus.id !== connectionId) {
          return
        }

        const rest = this.LiveObject.get(target.name)
        this.LiveObject.set(target.name, { ...rest, focus: null })
      })
    }

    inputs.forEach(input => {
      input.addEventListener('input', event => {
        onAnyChange(event)
        onFocus(event)
      })
      input.addEventListener('focus', onFocus)
      input.addEventListener('focuswithin', onFocus)
      input.addEventListener('blur', onBlur)
      //input.addEventListener('change', onAnyChange)
      //input.addEventListener('checked', onAnyChange)
    })


  }

  render () {
    if (!this.visible) {
      return null
    }

    return html`
      <slot></slot>
    `
  }
}

const inputTypes = {
  checkbox: 'checked'
}

function getInputValue (element) {
  if (inputTypes[element.type]) {
    return element[inputTypes[element.type]]
  }

  return element.value
}

function setInputValue (element, newVal) {
  if (inputTypes[element.type]) {
    return element[inputTypes[element.type]] = newVal
  }

  return element.value = newVal
}