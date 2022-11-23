import mangoStore from '@store/mangoStore'
import { Howl } from 'howler'
import { INITIAL_SOUND_SETTINGS } from 'pages/settings'
import { SOUND_SETTINGS_KEY } from './constants'

export type Notification = {
  type: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: null | string
  txid?: string
  show: boolean
  id: number
}

interface ReducerItems {
  [key: string]: {
    active: boolean
  }
}

export function notify(newNotification: {
  type?: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: string
  txid?: string
  noSound?: boolean
}) {
  const setMangoStore = mangoStore.getState().set
  const notifications = mangoStore.getState().notifications
  const lastId = mangoStore.getState().notificationIdCounter
  const newId = lastId + 1
  const successSound = new Howl({
    src: ['/sounds/transaction-success.mp3'],
    volume: 0.5,
  })
  const failSound = new Howl({
    src: ['/sounds/transaction-fail.mp3'],
    volume: 0.2,
  })
  const savedSoundSettings = localStorage.getItem(SOUND_SETTINGS_KEY)
  const soundSettings = savedSoundSettings
    ? JSON.parse(savedSoundSettings)
    : INITIAL_SOUND_SETTINGS

  if (newNotification.type && !newNotification.noSound) {
    switch (newNotification.type) {
      case 'success': {
        if (soundSettings['transaction-success']) {
          successSound.play()
        }
        break
      }
      case 'error': {
        if (soundSettings['transaction-fail']) {
          failSound.play()
        }
      }
    }
  }

  const newNotif: Notification = {
    id: newId,
    type: 'success',
    show: true,
    description: null,
    ...newNotification,
  }

  setMangoStore((state) => {
    state.notificationIdCounter = newId
    state.notifications = [...notifications, newNotif]
  })
}
