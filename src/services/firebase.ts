import { onUnmounted, ref } from 'vue'
import firebase from 'firebase/app'
// import 'firebase/auth'
import 'firebase/database'

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

// export const auth = firebase.auth()

export const { ServerValue } = firebase.database
export const database = app.database()
export const keyField = 'id'

export default firebase

if (window.location.hostname === 'localhost') {
  // auth.useEmulator('http://localhost:9099/')
  database.useEmulator('localhost', 9000)
}

export function toKeyFieldArray(obj: object, theKeyField = keyField) {
  return Object.entries(obj || {}).map(([key, value]) => ({
    [theKeyField]: key,
    ...(value || {}),
  }))
}
export function useRtdbArray<T = any>(reference: firebase.database.Reference) {
  const arr = ref<T[]>()
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    arr.value = toKeyFieldArray(snapshot.val())
  }
  reference.on('value', handler)
  onUnmounted(() => reference.off('value', handler))
  return arr
}
export function useRtdbObject<T = any>(reference: firebase.database.Reference) {
  const obj = ref<T[]>()
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    obj.value = snapshot.val()
  }
  reference.on('value', handler)
  onUnmounted(() => reference.off('value', handler))
  return obj
}
