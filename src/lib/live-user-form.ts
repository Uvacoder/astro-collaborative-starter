import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { SelfAndOthersClass } from './utils/SelfAndOthersClass'
import './avatar-and-fallback'
import './user-line'
import { LiveblocksRoom } from './liveblocks-room'

export const tagName = 'live-user-form'

@customElement(tagName)
export class LiveUserForm extends SelfAndOthersClass {
  @property({ type: Boolean })
  visible: boolean = false

  get userInputs () {
    const find = x => this.querySelector(`input[name="user-${x}"]`) as HTMLInputElement
    return {
      name: find('name'),
      color: find('color'),
      picture: find('picture'),
      status: find('status'),
    }
  }

  whenPresenceReady () {
    super.whenPresenceReady()
    this.attachListeners()
    this.visible = true
  }

  attachListeners () {
    Object.entries(this.userInputs).forEach(([key, inputElement]) => {
      if (!inputElement) {
        return
      }

      inputElement.addEventListener('input', () => {
        const room: LiveblocksRoom = document.querySelector('liveblocks-room')
        room.setUser({ [key]: inputElement.value })
      })
    })
  }

  updateInputValues () {
    Object.entries(this.userInputs).forEach(([key, inputElement]) => {
      if (this.self[key] && inputElement) {
        inputElement.value = this.self[key]
      }
    })
  }

  render () {
    if (!this.visible) {
      return null
    }

    this.updateInputValues()

    return html`
      <slot></slot>
    `
  }
}
