<template>
  <form class="Auth" @submit.prevent="handleSignInWithEmailLink">
    <div class="Box-row d-flex flex-column" style="gap: 8px; border-top-left-radius: 0; border-top-right-radius: 0;">
      <input type="email" name="email" v-model="email" required placeholder="Email" aria-label="Email" class="form-control" />
      <Button type="submit" :loading="isLoading === 'email'" :disabled="!isValid" class="btn-primary btn-block">
        Sign in with email link
      </Button>
    </div>
    <footer class="Box-footer">
      <Button type="button" :loading="isLoading === 'google'" class="btn-block" @click="handleSignInWithGoogle">
        Sign in with Google
      </Button>
    </footer>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, ref } from 'vue'

import { firebase, auth } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import Button from './Button.vue'

export default defineComponent({
  name: 'Auth',
  components: {
    Button,
  },
  setup() {
    const toast = inject<Function>('toast')
    const [runAsync] = useAsyncWrapper()
    const isLoading = ref<boolean | string>(false)

    const email = ref<string>()
    const isValid = computed(() => Boolean(email.value))
    const EMAIL_LINK_KEY = 'plantrack.emailForSignInWithEmailLink'
    async function handleSignInWithEmailLink() {
      isLoading.value = 'email'
      await runAsync(async () => {
        if (email.value) {
          await auth.sendSignInLinkToEmail(email.value, {
            url: window.location.href,
            handleCodeInApp: true,
          })
          window.localStorage.setItem(EMAIL_LINK_KEY, email.value)
          toast?.('Email link sent successfully', 'success')
          email.value = undefined
        } else {
          throw new Error('Missing email')
        }
      })
      isLoading.value = false
    }
    onMounted(async () => {
      if (auth.isSignInWithEmailLink(window.location.href)) {
        isLoading.value = 'email'
        await runAsync(async () => {
          const email = window.localStorage.getItem(EMAIL_LINK_KEY) || window.prompt('Please provide your email for confirmation') || ''
          await auth.signInWithEmailLink(email, window.location.href)
          window.localStorage.removeItem(EMAIL_LINK_KEY)
          window.history.replaceState(null, '', window.location.pathname)
        })
        isLoading.value = false
      }
    })

    async function handleSignInWithGoogle() {
      isLoading.value = 'google'
      await runAsync(async () => {
        const google = new firebase.auth.GoogleAuthProvider()
        await auth.signInWithPopup(google)
      })
      isLoading.value = false
    }

    return {
      email,
      isValid,
      isLoading,
      handleSignInWithEmailLink,
      handleSignInWithGoogle,
    }
  }
})
</script>
