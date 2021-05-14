<template>
  <div class="Recorder">
    <AddPlant v-if="isAddingPlant" style="margin: 32px;" />
    <AddBed v-if="isAddingBed" style="margin: 32px;" />
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <label>
          Plant(s)
          <button type="button" @click="isAddingPlant = !isAddingPlant">Add Plant</button>
          <button type="button" @click="isAddingBed = !isAddingBed">Add Bed</button>
          <button type="reset" @click="handleReset">Reset</button>
        </label>
        <PlantTreeView multiple v-model="plantIds" />
      </fieldset>

      <fieldset>
        <label>Event</label>
        <select v-model="eventId">
          <option
            v-for="event in events"
            :key="event.id"
            :value="event.id"
          >
            {{event.id}}
          </option>
        </select>
      </fieldset>

      <fieldset v-if="eventId === 'transplant'">
        <label>Where To</label>
        <PlantTreeView v-model="newBedIds" />
      </fieldset>
      <fieldset v-if="eventId === 'harvest'">
        <label>How Much</label>
        <input v-model="weight" type="number" min="1" step="0.01" />
        <select v-model="weightUnit">
          <option>g</option>
          <option>kg</option>
          <option>oz</option>
          <option>lb</option>
        </select>
      </fieldset>

      <fieldset>
        <label>When</label>
        <input type="datetime-local" v-model="at" />
      </fieldset>

      <fieldset>
        <label>Note</label>
        <textarea v-model="note"></textarea>
      </fieldset>

      <fieldset>
        <label>Attachment(s)</label>
        <input type="file" multiple @change="files = $event.target.files" />
      </fieldset>

      <fieldset>
        <button type="submit" :disabled="!plantIds.length || !eventId">Add Entry</button>
      </fieldset>
    </form>
    <pre>{{newBedIds}}</pre>
    <pre>{{plantIds}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import { events, Entry, NewEntity, Attachment } from '../services/data'
import { database, ServerValue, storage } from '../services/firebase'
import AddBed from '../components/AddBed.vue'
import AddPlant from '../components/AddPlant.vue'
import PlantTreeView from '../components/PlantTreeView.vue'

export default defineComponent({
  name: 'Recorder',
  components: {
    AddBed,
    AddPlant,
    PlantTreeView,
  },
  setup() {
    const isAddingBed = ref(false)
    const isAddingPlant = ref(false)
    const plantIds = ref<string[]>([])
    const eventId = ref<string>()
    const at = ref<string>()
    const note = ref<string>()
    const files = ref<FileList>()

    const newBedIds = ref<string[]>([])
    const weight = ref<number>()
    const weightUnit = ref<string>('g')

    function handleReset() {
      plantIds.value = []
      newBedIds.value = []
      weight.value = undefined
      weightUnit.value = 'g'
      at.value = undefined
      note.value = undefined
      files.value = undefined
    }
    async function handleSubmit() {
      await Promise.all(plantIds.value.map(async (plantId) => {
        let payload: Entry['payload'];
        if (!eventId.value) return
        switch (eventId.value) {
          case 'transplant': {
            const newBedId = newBedIds.value?.[0]
            if (!newBedId) return // @TODO

            const bedIdRef = database.ref(`/users/mismith/plants/${plantId}/bedId`)
            const oldBedId = (await bedIdRef.once('value')).val()
            payload = {
              oldBedId,
              newBedId,
            }
            await bedIdRef.set(newBedId)
            break
          }
          case 'harvest': {
            if (weight) {
              payload = {
                weight: {
                  value: weight.value,
                  unit: weightUnit.value,
                }
              }
            }
            break
          }
          case 'cull': {
            const bedIdRef = database.ref(`/users/mismith/plants/${plantId}/bedId`)
            const oldBedId = (await bedIdRef.once('value')).val()
            payload = {
              oldBedId,
            }
            await bedIdRef.remove()
            break
          }
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
        const attachments = await Promise.all(Array.from(files.value || []).map(async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Attachment must be under 10MB (${file.name})`)
          }
          // if (!file.type.startsWith('image/')) throw new Error('Attachment must be an image')
          const fileKey = database.ref().push().key
          const ref = storage.ref(`/users/mismith/attachments/${fileKey}`)
          await ref.put(file)

          const attachment: Attachment = {
            name: file.name,
            size: file.size,
            type: file.type,
            url: ref.fullPath,
            at: Date.now(),
          }
          return attachment
        }))

        const newEntry: NewEntity<Entry> = {
          eventId: eventId.value,
          at: at.value ? new Date(at.value).valueOf() : ServerValue.TIMESTAMP,
          payload: payload || null,
          attachments,
          note: note.value || null,
          createdAt: ServerValue.TIMESTAMP,
        }
        await database.ref(`/users/mismith/plants/${plantId}/entries`).push(newEntry)
      }))
      
      handleReset()
    }

    return {
      isAddingBed,
      isAddingPlant,
      plantIds,
      eventId,
      at,
      note,
      files,

      events,
      newBedIds,
      weight,
      weightUnit,

      handleReset,
      handleSubmit,
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.Recorder {
  form {
    display: flex;
    flex-direction: column;
    overflow: hidden; // @HACK: AddPlant <select> is too wide

    fieldset {
      display: flex;
      flex-direction: column;

      .TreeView,
      input,
      select,
      textarea,
      [type="submit"] {
        font-size: 16px;
      }

      textarea {
        resize: vertical;
      }
    }
  }
}
</style>