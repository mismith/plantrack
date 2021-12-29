<template>
  <form @submit.prevent="handleSubmit" class="AddCrop">
    <fieldset>
      <label>Import Crops</label>
      <input type="file" accept="text/csv" @change="handleImport" />
    </fieldset>
    
    <fieldset>
      <label>ID</label>
      <input type="text" v-model="name" required />
    </fieldset>

    <fieldset>
      <label>Name</label>
      <input type="text" v-model="nickname" />
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!name">Add Crop</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import { Crop, NewEntity } from '../services/data'
import { database, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddCrop',
  setup() {
    const name = ref<string>()
    const nickname = ref<string>()

    return {
      name,
      nickname,


    async handleImport(event: any) {
      const [file] = event.target.files
      const csv: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e: any) => resolve(e.target.result)
        reader.onerror = reject;
        reader.readAsText(file)
      })
      const [headersStr, ...rowsStrs] = csv.split('\n')
      const headers = headersStr.split(',').map(chunk => chunk?.trim?.() || chunk)
      const rows = rowsStrs.map(rowStr => rowStr.split(',').map(chunk => chunk?.trim?.() || chunk))
      const newCrops = rows.map(row => {
        const crop: any = {}
        headers.forEach((name, index) => {
          if (/^[\d\.]+$/.test(row[index])) {
            crop[name] = Number.parseFloat(row[index])
          } else if (row[index] !== '') {
            crop[name] = row[index]
          }
        })
        return crop
      })

      const existingCrops = Object.entries((await database.ref('/users/mismith/crops').once('value')).val())
      await Promise.all(newCrops.map(async (newCrop) => {
        const existingCrop = existingCrops.find(([id, { name }]: [string, any]) => name === newCrop.name)
        if (existingCrop) {
          await database.ref(`/users/mismith/crops/${existingCrop[0]}`).update(newCrop)
        } else {
          await database.ref('/users/mismith/crops').push(newCrop)
        }
      }))

      window.alert('Import successful')
    },

      async handleSubmit() {
        if (!name.value) return

        const newCrop: NewEntity<Crop> = {
          name: name.value,
          nickname: nickname.value || null,
          createdAt: ServerValue.TIMESTAMP,
        }
        await database.ref('/users/mismith/crops').push(newCrop)

        name.value = undefined
        nickname.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>