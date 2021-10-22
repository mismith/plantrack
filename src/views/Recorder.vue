<template>
  <div class="Recorder">
    <Dialog v-model="isAddingPlant"><AddPlant /></Dialog>
    <Dialog v-model="isAddingBed"><AddBed /></Dialog>
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <label>
          Plant(s)
          <button type="button" :class="{ active: isAddingPlant }" @click="isAddingPlant = !isAddingPlant">Add Plant</button>
          <button type="button" :class="{ active: isAddingBed }" @click="isAddingBed = !isAddingBed">Add Bed</button>
          <button type="reset" @click="handleReset">Reset</button>
        </label>
        <PlantTreeView v-if="!isLoading" multiple v-model="plantIds" />
      </fieldset>

      <fieldset>
        <label>Event</label>
        <select v-model="eventId">
          <option></option>
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

      <fieldset v-if="eventId === 'transplant' || eventId === 'splice'">
        <label>Where To</label>
        <PlantTreeView v-model="newBedIds" />
      </fieldset>
      <fieldset v-if="eventId === 'splice'">
        <label>New Name</label>
        <input v-model="newName" :placeholder="newNamePlaceholder" />
      </fieldset>
      <fieldset v-if="eventId === 'harvest'">
        <label>How Much</label>
        <div style="display: flex">
          <input v-model="weight" min="1" step="0.01" inputmode="decimal" style="flex: auto;" />
          <select v-model="weightUnit">
            <option>g</option>
            <option>kg</option>
            <option>oz</option>
            <option>lb</option>
            <option>items</option>
          </select>
          <select v-if="plantIds.length > 1" v-model="weightSplit">
            <option v-for="key in WEIGHT_SPLIT" :key="key">{{key}}</option>
          </select>
        </div>
      </fieldset>
      <fieldset v-if="eventId === 'harvest'">
        <label>Cull Too</label>
        <input v-model="cullToo" type="checkbox" />
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
        <button type="submit" :disabled="!isValid || isLoading">Add Entry</button>
        <progress v-if="isLoading" style="width: 100%;" />
      </fieldset>
    </form>
    <pre>{{newBedIds}}</pre>
    <pre>{{plantIds}}</pre>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

import { events, Entry, NewEntity, Attachment, getSuggestedPlantName, usePlants, useCrops } from '../services/data'
import { database, ServerValue, storage } from '../services/firebase'
import Dialog from '../components/Dialog.vue'
import AddBed from '../components/AddBed.vue'
import AddPlant from '../components/AddPlant.vue'
import PlantTreeView from '../components/PlantTreeView.vue'

const WEIGHT_SPLIT = {
  ALL: 'total',
  EACH: 'each',
}
function round(number: number, numDecimals: number = 2) {
  const multiplier = 10 ** numDecimals;
  return Math.round(number * multiplier + Number.EPSILON) / multiplier;
}

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
  newBedId,
  newName,
  weight,
  weightUnit,
  at,
  note,
}: {
  plantId: string,
  eventId?: string,
  newBedId?: string,
  newName?: string,
  weight?: number,
  weightUnit?: string,
  at?: string,
  note?: string,
}, attachments?: Entry['attachments']) {
  if (!plantId || !eventId) return
  const plantsRef = database.ref('/users/mismith/plants')
  const plantRef = plantsRef.child(plantId)

  let payload: Entry['payload']
  const transplant = async () => {
    if (!newBedId) throw new Error('no bed specified')

    const bedIdRef = plantRef.child('bedId')
    const oldBedId = (await bedIdRef.once('value')).val()
    return {
      bedIdRef,
      oldBedId,
    }
  }
  switch (eventId) {
    case 'transplant': {
      const { bedIdRef, oldBedId } = await transplant()
      payload = {
        oldBedId,
        newBedId,
      }
      await bedIdRef.set(newBedId)
      break
    }
    case 'splice': {
      const { oldBedId } = await transplant()
      const newPlantId = database.ref().push().key
      payload = {
        oldBedId,
        newBedId,
        oldPlantId: plantId,
        newPlantId,
      }
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
      const bedIdRef = plantRef.child('bedId')
      const oldBedId = (await bedIdRef.once('value')).val()
      payload = {
        oldBedId,
      }
      await bedIdRef.remove()
      break
    }
  }

  const newEntry: NewEntity<Entry> = {
    eventId,
    at: at ? new Date(at).valueOf() : ServerValue.TIMESTAMP,
    payload: payload || null,
    attachments: attachments || null,
    note: note || null,
    createdAt: ServerValue.TIMESTAMP,
  }
  await plantRef.child('entries').push(newEntry)

  if (eventId === 'splice' && payload) {
    const oldPlant = (await plantRef.once('value')).val()
    const newPlant = {
      ...oldPlant,
      bedId: payload.newBedId,
      name: newName,
    }
    await plantsRef.child(payload.newPlantId).set(newPlant)
  }
}

export default defineComponent({
  name: 'Recorder',
  components: {
    Dialog,
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
    const newName = ref<string>()
    const plants = usePlants();
    const crops = useCrops();
    const cropId = computed(() => plants.value?.find(({ id }) => id === plantIds.value?.[0])?.cropId)
    const newNamePlaceholder = computed(() => getSuggestedPlantName(cropId.value, crops.value, plants.value))

    const weight = ref<string>()
    const weightUnit = ref<string>('g')
    const weightSplit = ref<string>(WEIGHT_SPLIT.ALL)
    const cullToo = ref(false)

    const isValid = computed(() => {
      const requireds = plantIds.value.length && eventId.value
      const conditionals = (() => {
        switch (eventId.value) {
          case 'transplant': return newBedIds.value.length
          case 'splice': return newBedIds.value.length === 1 && plantIds.value.length === 1
          default: return true
        }
      })()
      return Boolean(requireds && conditionals)
    })
    const isLoading = ref(false);

    function handleReset() {
      plantIds.value = []
      eventId.value = undefined
      newBedIds.value = []
      weight.value = undefined
      weightUnit.value = 'g'
      weightSplit.value = WEIGHT_SPLIT.ALL
      cullToo.value = false
      at.value = undefined
      note.value = undefined
      files.value = undefined
    }
    async function handleSubmit() {
      isLoading.value = true;
      const individualWeight = weight.value
        ? (
          weightSplit.value === WEIGHT_SPLIT.ALL
            ? round(Number.parseFloat(weight.value) / plantIds.value.length)
            : Number.parseFloat(weight.value)
        )
        : undefined;

      const attachments = await Promise.all(Array.from(files.value || []).map(uploadAttachment))
      await Promise.all(plantIds.value.map(async (plantId) => {
        const params = {
          plantId,
          eventId: eventId.value,
          newBedId: newBedIds.value?.[0],
          newName: newName.value || newNamePlaceholder.value,
          weight: individualWeight,
          weightUnit: weightUnit.value,
          at: at.value,
          note: note.value,
        }
        await addPlantEntry(params, attachments)

        if (cullToo.value) {
          await addPlantEntry({
            ...params,
            eventId: 'cull',
          })
        }
      }))

      handleReset()
      isLoading.value = false;
    }

    return {
      WEIGHT_SPLIT,

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
      newName,
      newNamePlaceholder,
      weight,
      weightUnit,
      weightSplit,
      cullToo,

      isValid,
      isLoading,

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