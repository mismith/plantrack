import { inject, ref } from 'vue'

export function useAsyncWrapper(): [typeof wrapper, typeof isLoading] {
  const toastError = inject<Function>('toastError')
  const isLoading = ref(false)

  async function wrapper(fn: Function): Promise<any> {
    let value
    isLoading.value = true
    try {
      value = await fn()
    } catch (error) {
      console.error(error)

      toastError?.(error)
    }
    isLoading.value = false
    return value
  }
  return [wrapper, isLoading]
}
