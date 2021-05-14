<template>
  <div class="Recorder">
    <AddPlant v-if="isAddingPlant" style="margin: 32px;" />
    <AddBed v-if="isAddingBed" style="margin: 32px;" />
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <label>
          Plant(s)
          <button type="button" :class="{ active: isAddingPlant }" @click="isAddingPlant = !isAddingPlant">Add Plant</button>
          <button type="button" :class="{ active: isAddingBed }" @click="isAddingBed = !isAddingBed">Add Bed</button>
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
        <div style="display: flex;">
          <button
            v-for="event in featuredEvents"
            :key="event.id"
            type="button"
            style="flex: auto;"
            :class="{ active: eventId === event.id }"
            @click="eventId = event.id"
          >
            <span :style="`display: inline-block; width: 1em; height: 1em; background-color: ${event.color}; vertical-align: middle; border: solid 1px currentColor; border-radius: 1em;`" />
            {{event.id}}
          </button>
        </div>
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
        <button type="submit" :disabled="!isValid">Add Entry</button>
      </fieldset>
    </form>
    <pre>{{newBedIds}}</pre>
    <pre>{{plantIds}}</pre>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import { events, Entry, NewEntity, Attachment } from '../services/data'
import { database, ServerValue, storage } from '../services/firebase'
import AddBed from '../components/AddBed.vue'
import AddPlant from '../components/AddPlant.vue'
import PlantTreeView from '../components/PlantTreeView.vue'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
async function uploadAttachment(file: File): Promise<Attachment> {
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
}
async function addPlantEntry({
  plantId,
  eventId,
  newBedIds,
  weight,
  weightUnit,
  files,
  at,
  note,
}: {
  plantId: string,
  eventId?: string,
  newBedIds?: string[],
  weight?: number,
  weightUnit?: string,
  files?: FileList,
  at?: string,
  note?: string,
}) {
  if (!plantId || !eventId) return

  let payload: Entry['payload'];
  switch (eventId) {
    case 'transplant': {
      const newBedId = newBedIds?.[0]
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
            value: weight,
            unit: weightUnit,
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

  const attachments = await Promise.all(Array.from(files || []).map(uploadAttachment))

  const newEntry: NewEntity<Entry> = {
    eventId,
    at: at ? new Date(at).valueOf() : ServerValue.TIMESTAMP,
    payload: payload || null,
    attachments,
    note: note || null,
    createdAt: ServerValue.TIMESTAMP,
  }
  await database.ref(`/users/mismith/plants/${plantId}/entries`).push(newEntry)
}

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

    const isValid = computed(() => {
      const requireds = plantIds.value.length && eventId.value
      const conditionals = (() => {
        switch (eventId.value) {
          case 'transplant': return newBedIds.value.length
          case 'harvest': return weight.value || 0 > 0 && weightUnit.value
          default: return true
        }
      })()
      return Boolean(requireds && conditionals)
    })

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
        await addPlantEntry({
          plantId,
          eventId: eventId.value,
          newBedIds: newBedIds.value,
          weight: weight.value,
          weightUnit: weightUnit.value,
          files: files.value,
          at: at.value,
          note: note.value,
        })
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
      featuredEvents: events.filter(({ featured }) => featured),
      newBedIds,
      weight,
      weightUnit,

      isValid,

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