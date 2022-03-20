<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from 'vue'

import {
  events,
  Entry,
  NewEntity,
  // Bed, // @TODO: why aren't these importing properly at runtime?
  // Plant, // @TODO: why aren't these importing properly at runtime?
  Attachment,
  getSuggestedPlantName,
  usePlants,
  useCrops,
  useBeds,
  useTags,
  usePersistentRef,
} from '../services/data'
import { database, getUserRefPath, ServerValue, storage } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import SelectMenu from '../components/SelectMenu.vue'
import PlantTreeView from '../components/PlantTreeView.vue'
import TransitionExpand from '../components/TreeView/TransitionExpand.vue'
import Button from '../components/Button.vue'
import Octicon from '../components/Octicon.vue'
import TagSelect from '../components/TagSelect.vue'
import Blip from '../components/Blip.vue'
import FilePreview from '../components/FilePreview.vue'

const WEIGHT_SPLIT = {
  ALL: 'total',
  EACH: 'each',
}
function round(number: number, numDecimals: number = 2) {
  const multiplier = 10 ** numDecimals
  return Math.round(number * multiplier + Number.EPSILON) / multiplier
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
async function uploadAttachment(file: File, id: string = database.ref().push().key!): Promise<Attachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Attachments must be under 10MB (${file.name})`)
  }
  // if (!file.type.startsWith('image/')) throw new Error('Attachment must be an image')
  const ref = storage.ref(getUserRefPath(`/attachments/${id}`))
  await ref.put(file)

  const attachment: Attachment = {
    id,
    name: file.name,
    size: file.size,
    type: file.type,
    at: Date.now(),
  }
  return attachment
}

async function addPlantEntry({
  batchId,
  plantId,
  eventId,
  newBedId,
  newName,
  weight,
  weightUnit,
  at,
  note,
  attachments,
  tagIds,
}: {
  batchId?: string,
  plantId: string,
  eventId?: string,
  newBedId?: string,
  newName?: string,
  weight?: number,
  weightUnit?: string,
  at?: string,
  note?: string,
  attachments?: Entry['attachments'],
  tagIds?: string[],
}) {
  if (!plantId || !eventId) return
  const plantsRef = database.ref(getUserRefPath('/plants'))
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
      const newPlantId = database.ref().push().key!
      payload = {
        oldBedId,
        newBedId,
        oldPlantId: plantId,
        newPlantId,
      }
      break
    }
    case 'harvest': {
      if (weight && weightUnit) {
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
    batchId: batchId || null,
    eventId,
    at: at ? new Date(at).valueOf() : ServerValue.TIMESTAMP,
    payload: payload || null,
    note: note || null,
    attachments: attachments || null,
    tagIds: tagIds?.length && tagIds || null,
    createdAt: ServerValue.TIMESTAMP,
  }
  await plantRef.child('entries').push(newEntry)

  if (eventId === 'splice' && payload?.newBedId && payload?.newPlantId && newName) {
    const oldPlant = (await plantRef.once('value')).val()
    const newPlant = {
      ...oldPlant,
      bedId: payload.newBedId,
      name: newName,
    }
    await plantsRef.child(payload.newPlantId).set(newPlant)
  }
}

const plantIds = ref<string[]>([])
const eventId = ref<string>()
const note = ref<string>()
const [beds] = useBeds()
const newBedIds = ref<string[]>([])
const newName = ref<string>()
const [plants] = usePlants()
const [crops] = useCrops()
const cropId = computed(() => plants.value?.find(({ id }) => id === plantIds.value?.[0])?.cropId)
const newNamePlaceholder = computed(() => getSuggestedPlantName(cropId.value, crops.value, plants.value))
const weight = ref<string>()
const weightUnit = ref<string>('g')
const weightSplit = ref<string>(WEIGHT_SPLIT.ALL)
const cullToo = ref(false)
const at = ref<string>()
const files = ref<File[]>()
const [tags] = useTags()
const tagIds = ref<string[]>([])

const defaultBookmarkedEventIds = ['seed', 'sprout', 'harvest', 'cull', 'other']
const bookmarkedEventIds = usePersistentRef<string[]>('Record.bookmarkedEventIds', ['seed', 'sprout', 'harvest', 'cull', 'other'])
const isDefaultBookmarkedEventIds = computed(() => defaultBookmarkedEventIds.length === bookmarkedEventIds.value.length
  && defaultBookmarkedEventIds.every(id => bookmarkedEventIds.value.includes(id)))
const bookmarkedEvents = computed(() => events.filter(({ id }) => bookmarkedEventIds.value.includes(id)))
function resetBookmarkedEventIds() {
  if (window.confirm('Are you sure?')) {
    bookmarkedEventIds.value = defaultBookmarkedEventIds
  }
}
function handleBookmarkedEventIdToggle(eventId: string) {
  bookmarkedEventIds.value = bookmarkedEventIds.value.includes(eventId)
    ? bookmarkedEventIds.value.filter(id => id !== eventId)
    : [...bookmarkedEventIds.value, eventId]
}

const isShowing = reactive({
  at: false,
  attachments: false,
  tagIds: false,
})
const atRef = ref<HTMLInputElement>()
function handleShowAt() {
  isShowing.at = true
  window.setTimeout(() => atRef.value?.focus?.())
}
const attachmentsRef = ref<HTMLInputElement>()
function handleAttachmentsChange({ target }: Event & { target: { files: FileList } }) {
  if (!target.files?.length) return
  if (!files.value) files.value = []

  files.value.push(...Array.from(target.files))
  
  if (attachmentsRef.value) {
   attachmentsRef.value.value = ''
  }
}
const isCaptureSupported = (() => {
  const el = document.createElement('input')
  return el.capture !== undefined
})()
function handleShowAttachments(isCamera = false) {
  isShowing.attachments = true
  window.setTimeout(() => {
    const input = attachmentsRef.value
    if (!input) return

    if (isCamera) {
      input.setAttribute('capture', '')
    }
    input.click?.()
    if (isCamera) {
      input.removeAttribute('capture')
    }
  })
}
const tagIdsRef = ref<HTMLInputElement>()
function handleShowTags() {
  isShowing.tagIds = true
  if (tags.value?.length) {
    window.setTimeout(() => tagIdsRef.value?.querySelector('summary')?.click())
  }
}

const formRef = ref<HTMLFormElement>()
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
  tagIds.value = []
  files.value = undefined
  isShowing.at = false
  isShowing.attachments = false
  isShowing.tagIds = false
  formRef.value?.reset()
}
const toast = inject<Function>('toast')
const [runAsync, isSubmitting] = useAsyncWrapper()
async function handleSubmit() {
  await runAsync(async () => {
    const individualWeight = weight.value
      ? (
        weightSplit.value === WEIGHT_SPLIT.ALL
          ? round(Number.parseFloat(weight.value) / plantIds.value.length)
          : Number.parseFloat(weight.value)
      )
      : undefined

    const batchId = plantIds.value.length > 1 ? database.ref().push().key! : undefined
    const attachments = await Promise.all(Array.from(files.value || []).map((file) => uploadAttachment(file)))
    await Promise.all(plantIds.value.map(async (plantId) => {
      const params = {
        batchId,
        plantId,
        eventId: eventId.value,
        newBedId: newBedIds.value?.[0],
        newName: newName.value || newNamePlaceholder.value,
        weight: individualWeight,
        weightUnit: weightUnit.value,
        at: at.value,
        note: note.value,
        tagIds: tagIds.value,
      }
      await addPlantEntry({
        ...params,
        attachments, // don't include attachments in cull entry
      })

      if (cullToo.value) {
        await addPlantEntry({
          ...params,
          eventId: 'cull',
        })
      }
    }))

    toast?.('Entry added successfully', 'success')

    handleReset()
  })
}

const isAddingPlant = inject('isAddingPlant')
const isAddingBed = inject('isAddingBed')
</script>

<template>
  <div class="Record container-md width-full mx-auto">
    <form ref="formRef" @submit.prevent="handleSubmit" class="p-3">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Plant(s)</label>
        </header>
        <SelectMenu
          restore-key="Record.plantIds"
          :value="plantIds.length > 1 ? `${plantIds.length} plants selected` : plantIds.map((plantId) => plants?.find(({ id }) => id === plantId)?.name).filter(Boolean)"
          title="Plants"
          createable
          createable-type="plant"
          :clearable="Boolean(plantIds.length)"
          editable
          @create="isAddingPlant = (newPlant) => plantIds.push(newPlant.id)"
          @clear="plantIds = []"
        >
          <template #header v-if="!plants?.length"><div /></template>
          <template #default="{ edit }">
            <PlantTreeView
              v-if="!isSubmitting && plants?.length"
              v-model="plantIds"
              restore-key="Record.plantIds"
              multiple
              :editable="edit()"
            />
          </template>
        </SelectMenu>
      </fieldset>

      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Event</label>
        </header>
        <div class="form-group-body">
          <SelectMenu
            restore-key="Record.eventId"
            :value="eventId"
            title="Events"
            editable
          >
            <template #header-content="{ edit }">
              <Button
                v-if="edit()"
                :disabled="isDefaultBookmarkedEventIds"
                class="btn-invisible px-2"
                @click="resetBookmarkedEventIds()"
              >
                Reset
              </Button>
            </template>
            <template #default="{ edit, close }">
              <div
                v-for="event in events"
                :key="event.id"
                role="menuitemcheckbox"
                :aria-checked="event.id === eventId"
                class="SelectMenu-item"
                @click="eventId = event.id; close();"
              >
                <Octicon name="check" class="SelectMenu-icon SelectMenu-icon--check" />
                <Blip :color="event.color" class="mr-2" />
                <span class="flex-auto">{{ event.id }}</span>
                <Button
                  v-if="edit()"
                  class="btn-invisible px-2 ml-3 mr-n1 mt-n1 mb-n1 anim-scale-in"
                  @click.stop="handleBookmarkedEventIdToggle(event.id)"
                >
                  <Octicon
                    :name="bookmarkedEventIds.includes(event.id) ? 'bookmark-fill' : 'bookmark'"
                    :size="24"
                    width="16"
                    height="16"
                  />
                </Button>
                <Octicon
                  v-else-if="bookmarkedEventIds.includes(event.id)"
                  name="bookmark-fill"
                  :size="24"
                  width="16"
                  height="16"
                  class="ml-3 mr-1"
                />
              </div>
            </template>
          </SelectMenu>
          <div v-if="bookmarkedEvents.length" class="d-flex flex-wrap mt-2" style="gap: 4px;">
            <Button
              v-for="event in bookmarkedEvents"
              :key="event.id"
              class="btn-sm px-2 flex-auto"
              :class="{ 'btn-outline': eventId === event.id }"
              :aria-selected="eventId === event.id"
              @click="eventId = event.id"
            >
              <Blip :color="event.color" />
              {{event.id}}
            </Button>
          </div>
        </div>
      </fieldset>

      <TransitionExpand>
        <fieldset v-if="eventId === 'transplant' || eventId === 'splice'" class="form-group required">
          <header class="form-group-header">
            <label>New Bed</label>
          </header>
          <SelectMenu
            restore-key="Record.newBedIds"
            :value="beds?.find(({ id }) => id === newBedIds[0])?.name || ''"
            title="Beds"
            createable
            createable-type="bed"
            editable
            @create="isAddingBed = (newBed) => { newBedIds = [newBed.id]; isAddingBed = false; }"
          >
            <template #header v-if="!beds?.length"><div /></template>
            <template #default="{ edit, close }">
              <PlantTreeView
                v-if="beds?.length"
                v-model="newBedIds"
                restore-key="Record.newBedIds"
                :filter="node => node.type !== 'entry'"
                :editable="edit()"
                @update:model-value="close()"
              />
            </template>
          </SelectMenu>
        </fieldset>
      </TransitionExpand>
      <TransitionExpand>
        <fieldset v-if="eventId === 'splice'" class="form-group">
          <header class="form-group-header">
            <label>New Name</label>
          </header>
          <input type="text" v-model="newName" :placeholder="newNamePlaceholder" class="form-control width-full" />
        </fieldset>
      </TransitionExpand>
      <TransitionExpand>
        <fieldset v-if="eventId === 'harvest'" class="form-group">
          <header class="form-group-header">
            <label>How Much</label>
          </header>
          <div style="display: flex; gap: 4px;">
            <input type="text" v-model="weight" min="1" step="0.01" inputmode="decimal" class="form-control width-full flex-auto" />
            <select v-model="weightUnit" class="form-control form-select width-auto">
              <option>g</option>
              <option>kg</option>
              <option>oz</option>
              <option>lb</option>
              <option>items</option>
            </select>
            <select v-if="plantIds.length > 1" v-model="weightSplit" class="form-control form-select width-auto">
              <option v-for="key in WEIGHT_SPLIT" :key="key">{{key}}</option>
            </select>
          </div>
        </fieldset>
      </TransitionExpand>
      <TransitionExpand>
        <fieldset v-if="eventId === 'harvest'" class="form-group">
          <header class="form-group-header">
            <label>Cull Too</label>
          </header>
          <input type="checkbox" v-model="cullToo" />
        </fieldset>
      </TransitionExpand>

      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Note</label>
        </header>
        <textarea v-model="note" class="form-control width-full"></textarea>
      </fieldset>

      <TransitionExpand>
        <fieldset v-if="isShowing.attachments" class="form-group">
          <header class="form-group-header">
            <label>Attachment(s)</label>
          </header>
          <div v-if="files?.length" class="mb-2">
            <div v-for="(file, index) in files" :key="`${index}-${file.name}`" class="d-flex flex-items-center">
              <FilePreview :file="file" style="object-fit: contain; max-width: 16px; max-height: 16px;" />
              <span class="pl-2">{{ file.name }}</span>
              <Button class="btn-octicon" @click="files?.splice(index, 1)">
                <Octicon name="x" />
              </Button>
            </div>
          </div>
          <div class="d-flex">
            <input
              ref="attachmentsRef"
              type="file"
              multiple
              class="form-control width-full mr-0"
              @change="handleAttachmentsChange"
            />
            <button type="button" class="btn-octicon" @click="files = undefined; isShowing.attachments = false;">
              <Octicon name="x-circle-fill" />
            </button>
          </div>
        </fieldset>
      </TransitionExpand>

      <TransitionExpand>
        <fieldset v-if="isShowing.tagIds" ref="tagIdsRef" class="form-group">
          <header class="form-group-header">
            <label>Tag(s)</label>
          </header>
          <TagSelect v-model="tagIds" @clear="tagIds = []; isShowing.tagIds = false;" />
        </fieldset>
      </TransitionExpand>

      <TransitionExpand>
        <fieldset v-if="isShowing.at" class="form-group">
          <header class="form-group-header">
            <label>When</label>
          </header>
          <div class="d-flex">
            <input ref="atRef" type="datetime-local" v-model="at" class="form-control width-full mr-0" />
            <button type="button" class="btn-octicon" @click="at = undefined; isShowing.at = false;">
              <Octicon name="x-circle-fill" />
            </button>
          </div>
        </fieldset>
      </TransitionExpand>

      <aside class="d-flex flex-wrap flex-justify-center mb-3" style="gap: 8px;">
        <Button v-if="isCaptureSupported" class="flex-auto" @click="handleShowAttachments(true)">
          <Octicon name="image" class="mr-2" />
          Add Photo
        </Button>
        <Button v-if="!isShowing.attachments" class="flex-auto" @click="handleShowAttachments()">
          <Octicon name="file" class="mr-2" />
          Add Attachment(s)
        </Button>
        <Button v-if="!isShowing.tagIds" class="flex-auto" @click="handleShowTags">
          <Octicon name="tag" class="mr-2" />
          Add Tag(s)
        </Button>
        <Button v-if="!isShowing.at" class="flex-auto" @click="handleShowAt">
          <Octicon name="calendar" class="mr-2" />
          Set Date/Time
        </Button>
      </aside>

      <footer class="color-bg-default p-3 mb-n3 ml-n3 mr-n3 border-top" style="position: sticky; bottom: 0;">
        <div class="form-group my-0">
          <button type="submit" :disabled="!isValid || isSubmitting" class="btn btn-primary btn-block btn-large f4">Add Entry</button>
          <progress v-if="isSubmitting" style="width: 100%;" />
        </div>
      </footer>
    </form>
  </div>
</template>
