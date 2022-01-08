<template>
  <form class="Auth Box m-auto" @submit.prevent="handleSignIn">
    <div class="Box-row d-flex flex-column" style="gap: 8px;">
      <input type="email" v-model="email" required placeholder="Email" aria-label="Email" class="form-control" />
      <input type="password" v-model="password" required placeholder="Password" aria-label="Password" class="form-control" />
      <button type="submit" :disabled="!isValid" class="btn btn-primary btn-block">Sign in</button>
    </div>
    <footer class="Box-footer">
      <Button type="button" :loading="isLoading" class="btn-block" @click="handleSignInWithGoogle">
        Sign in with Google
      </Button>
    </footer>
  </form>
  <aside v-if="errorMessage" class="position-fixed bottom-0 right-0">
    <div class="Toast Toast--error">
      <span class="Toast-icon">
        <Octicon name="stop" />
      </span>
      <div class="Toast-content">
        {{errorMessage}}
      </div>
      <button class="Toast-dismissButton" @click="errorMessage = undefined">
        <Octicon name="x" />
      </button>
    </div>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref, watch } from 'vue'

import { firebase, auth } from '../services/firebase'
import Button from './Button.vue'
import Octicon from './Octicon.vue'

export default defineComponent({
  name: 'Auth',
  components: {
    Button,
    Octicon,
  },
  setup() {
    const errorMessage = ref<string>()
    const errorMessageTimeout = ref()
    watch(errorMessage, (v) => {
      window.clearTimeout(errorMessageTimeout.value)
      if (v) {
        errorMessageTimeout.value = window.setTimeout(() => {
          errorMessage.value = undefined
        }, 5000)
      }
    })
    onBeforeUnmount(() => {
      window.clearTimeout(errorMessageTimeout.value)
    })

    const email = ref<string>()
    const password = ref<string>()
    const isValid = computed(() => Boolean(email.value && password.value))
    const isLoading = ref(false)
    async function handleSignIn() {
      isLoading.value = true;
      try {
        if (email.value && password.value) {
          await auth.signInWithEmailAndPassword(email.value, password.value)
        } else {
          throw new Error('Missing email and/or password')
        }
      } catch (error: any) {
        errorMessage.value = error?.getMessage?.() || error?.message || error
      }
      isLoading.value = false;
    }
    async function handleSignInWithGoogle() {
      isLoading.value = true;
      try {
        const google = new firebase.auth.GoogleAuthProvider()
        const { user } = await auth.signInWithPopup(google)
        console.log(user)
      } catch (error: any) {
        errorMessage.value = error?.getMessage?.() || error?.message || error
      }
      isLoading.value = false;
    }

    return {
      errorMessage,
      email,
      password,
      isValid,
      isLoading,
      handleSignIn,
      handleSignInWithGoogle,
    }
  }
})
</script>
