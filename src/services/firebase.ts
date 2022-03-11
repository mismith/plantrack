import { computed, onUnmounted, Ref, ref, watch } from 'vue'
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

if (import.meta.env.DEV) {
  // @ts-ignore
  auth.useEmulator(`http://${window.location.hostname}:9099/`, { disableWarnings: true })
  database.useEmulator(window.location.hostname, 9000)
  storage.useEmulator(window.location.hostname, 9199)
}

export function useUser() {
  const user = ref<firebase.User | null>()

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
export function useRtdbObject<T extends object>(
  source: Ref<firebase.database.Reference | firebase.database.Query> | firebase.database.Reference | firebase.database.Query,
  transformer: (value: any) => any = (value) => value,
): [Ref<T | undefined>, Ref<Boolean>] {
  const loading = ref(false)
  const obj = ref<T>()
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    obj.value = transformer(snapshot.val())
    loading.value = false
  }

  const reference = computed(() => (source as Ref).value || source)
  watch(reference, (newRef, oldRef) => {
    loading.value = true
    oldRef?.off('value', handler)
    newRef?.on('value', handler)
  }, { immediate: true })
  onUnmounted(() => reference.value?.off('value', handler))

  return [obj, loading]
}
export function useRtdbArray<T extends object>(
  source: Parameters<typeof useRtdbObject>[0],
  transformer: Parameters<typeof useRtdbObject>[1] = (value) => value,
): [Ref<T[] | undefined>, Ref<Boolean>] {
  return useRtdbObject<T[]>(source, (value) => toKeyFieldArray(value).map(transformer))
}
