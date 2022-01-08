<template>
  <form class="Auth Box m-auto" @submit.prevent="handleSignInWithEmailLink">
    <div class="Box-row d-flex flex-column" style="gap: 8px;">
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
import Button from './Button.vue'

export default defineComponent({
  name: 'Auth',
  components: {
    Button,
  },
  setup() {
    const toast = inject<any>('toast')
    const handleError = inject<any>('toastError')

    const email = ref<string>()
    const isValid = computed(() => Boolean(email.value))
    const EMAIL_LINK_KEY = 'plantrack.emailForSignInWithEmailLink'
    async function handleSignInWithEmailLink() {
      isLoading.value = 'email'
      try {
        if (email.value) {
          await auth.sendSignInLinkToEmail(email.value, {
            url: window.location.href,
            handleCodeInApp: true,
          })
          window.localStorage.setItem(EMAIL_LINK_KEY, email.value)
          toast('Email link sent successfully', 'success')
        } else {
          throw new Error('Missing email')
        }
      } catch (error) {
        handleError(error)
      }
      isLoading.value = false
    }
    onMounted(async () => {
      if (auth.isSignInWithEmailLink(window.location.href)) {
        isLoading.value = 'email'
        try {
          const email = window.localStorage.getItem(EMAIL_LINK_KEY) || window.prompt('Please provide your email for confirmation') || ''
          await auth.signInWithEmailLink(email, window.location.href)
          window.localStorage.removeItem(EMAIL_LINK_KEY)
          window.history.replaceState(null, '', window.location.pathname)
        } catch (error) {
          handleError(error)
        }
        isLoading.value = false
      }
    })

    const isLoading = ref<string | boolean>(false)
    async function handleSignInWithGoogle() {
      isLoading.value = 'google'
      try {
        const google = new firebase.auth.GoogleAuthProvider()
        await auth.signInWithPopup(google)
      } catch (error) {
        handleError(error)
      }
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
