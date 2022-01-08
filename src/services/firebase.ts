import { onUnmounted, ref } from 'vue'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/storage'

export { firebase }
export const config = {
  apiKey: 'AIzaSyDvmckvDo8aydVkAXLJ5kkoyLiCmQGot34',
  authDomain: 'plantrack-app.firebaseapp.com',
  projectId: 'plantrack-app',
  storageBucket: 'plantrack-app.appspot.com',
  messagingSenderId: '565377422033',
  appId: '1:565377422033:web:0503f8e5c07078c185ebf0',
  measurementId: 'G-R5HSP2WMFM'
}
export const app = firebase.initializeApp(config)

export const auth = firebase.auth()

export const { ServerValue } = firebase.database
export const database = app.database()
export const keyField = 'id'

export const storage = firebase.storage()

export default firebase

if (window.location.hostname === 'localhost') {
  auth.useEmulator('http://localhost:9099/', { disableWarnings: true })
  database.useEmulator('localhost', 9000)
  storage.useEmulator("localhost", 9199)
}

export function useUser() {
  const user = ref<firebase.User | null>(auth.currentUser)

  auth.onIdTokenChanged(authUser => {
    user.value = authUser
  })

  return user
}

export function getUserRefPath(path: string, user = auth.currentUser) {
  return `/users/${user?.uid}/${path.replace(/^\/+/, '/')}`
}

export function toKeyFieldArray<T extends object>(obj: Record<string, T>, theKeyField = keyField): T[] {
  return Object.entries(obj || {}).map(([key, value]) => ({
    [theKeyField]: key,
    ...(value || {}) as T,
  }))
}
export function useRtdbArray<T extends object>(reference: firebase.database.Reference) {
  const arr = ref<T[]>()
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    arr.value = toKeyFieldArray(snapshot.val())
  }
  reference.on('value', handler)
  onUnmounted(() => reference.off('value', handler))
  return arr
}
export function useRtdbObject<T extends Object>(reference: firebase.database.Reference) {
  const obj = ref<T>()
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    obj.value = snapshot.val()
  }
  reference.on('value', handler)
  onUnmounted(() => reference.off('value', handler))
  return obj
}
