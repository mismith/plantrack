<template>
  <div class="Recorder">
    <form ref="formRef" @submit.prevent="handleSubmit" class="p-3">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Plant(s)</label>
        </header>
        <TreeViewSelectMenu
          :value="plantIds.length > 1 ? `${plantIds.length} plants selected` : plantIds.map((plantId) => plants.find(({ id }) => id === plantId)?.name).filter(Boolean)"
          :clearable="Boolean(plantIds.length)"
          @clear="plantIds = []"
        >
          <template #prepend>
            <button type="button" class="btn-octicon ml-0 mr-1" @click="isAddingPlant = !isAddingPlant">
              <Octicon name="plus-circle" />
            </button>
          </template>
          <PlantTreeView v-if="!isLoading" v-model="plantIds" multiple />
        </TreeViewSelectMenu>
      </fieldset>

      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Event</label>
        </header>
        <div class="form-group-body">
          <select v-model="eventId" required class="form-control form-select width-full mb-2">
            <option></option>
            <option
              v-for="event in events"
              :key="event.id"
              :value="event.id"
            >
              {{event.id}}
            </option>
          </select>
          <div class="BtnGroup d-flex flex-wrap">
            <button
              v-for="event in featuredEvents"
              :key="event.id"
              type="button"
              class="BtnGroup-item btn btn-sm px-1"
              :class="{ 'btn-outline': eventId === event.id }"
              style="flex: auto;"
              :aria-selected="eventId === event.id"
              @click="eventId = event.id"
            >
              <span :style="`display: inline-block; width: 1em; height: 1em; background-color: ${event.color}; vertical-align: middle; border: solid 1px currentColor; border-radius: 1em;`" />
              {{event.id}}
            </button>
          </div>
        </div>
      </fieldset>

      <TransitionExpand>
        <fieldset v-if="eventId === 'transplant' || eventId === 'splice'" class="form-group required">
          <header class="form-group-header">
            <label>Where To</label>
          </header>
          <TreeViewSelectMenu
            v-model="isNewBedIdsSelectOpen"
            :value="beds?.find(({ id }) => id === newBedIds[0])?.name || ''"
          >
            <template #prepend>
              <button type="button" class="btn-octicon ml-0 mr-1" @click="isAddingBed = !isAddingBed">
                <Octicon name="plus-circle" />
              </button>
            </template>
            <PlantTreeView
              v-model="newBedIds"
              :filter="node => node.type !== 'entry'"
            />
          </TreeViewSelectMenu>
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

      <TransitionExpand>
        <fieldset v-if="isShowing.attachments" class="form-group">
          <header class="form-group-header">
            <label>Attachment(s)</label>
          </header>
          <div class="d-flex">
            <input ref="attachmentsRef" type="file" multiple class="form-control width-full mr-0" @change="files = $event.target.files" />
            <button type="button" class="btn-octicon" @click="files = undefined; attachmentsRef.value = null; isShowing.attachments = false;">
              <Octicon name="x-circle-fill" />
            </button>
          </div>
        </fieldset>
      </TransitionExpand>

      <TransitionExpand>
        <fieldset v-if="isShowing.tags" ref="tagIdsRef" class="form-group">
          <header class="form-group-header">
            <label>Tag(s)</label>
          </header>
          <SelectMenu
            :value="tagIds.length"
            clearable
            @clear="tagIds = []; isShowing.tags = false;"
          >
            <template #prepend>
              <button type="button" class="btn-octicon ml-0 mr-1" @click="isAddingTag = !isAddingTag">
                <Octicon name="plus-circle" />
              </button>
            </template>
            <template #value>
              <span
                v-for="tag in tagIds.map(tagId => tags.find(({ id }) => id === tagId)).filter(Boolean)"
                :key="tag.id"
                class="Label mr-1"
                :style="{ color: tag.color, borderColor: tag.color && 'currentColor' }"
              >
                {{tag.name}}
              </span>
            </template>
            <div class="SelectMenu-list">
              <button
                v-for="tag in tags"
                :key="tag.id"
                type="button"
                role="menuitemcheckbox"
                :aria-checked="tagIds.includes(tag.id)"
                class="SelectMenu-item"
                @click="tagIds = tagIds.includes(tag.id) ? tagIds.filter(tagId => tagId !== tag.id) : tagIds.concat(tag.id)"
              >
                <Octicon name="check" class="SelectMenu-icon SelectMenu-icon--check" />
                <span
                  class="Label Label--large mr-auto"
                  :style="{ color: tag.color, borderColor: tag.color && 'currentColor' }"
                >
                  {{tag.name}}
                </span>
                <span class="circle btn-octicon p-1 ml-3 mr-n2" @click.stop="isEditingTag = tag">
                  <Octicon name="pencil" />
                </span>
              </button>
            </div>
          </SelectMenu>
        </fieldset>
      </TransitionExpand>

      <aside class="d-flex flex-wrap flex-justify-center mb-3" style="gap: 8px;">
        <Button v-if="!isShowing.at" class="flex-auto" @click="handleShowAt">
          <Octicon name="plus-circle" class="mr-2" />
          Use Specific Date/Time
        </Button>
        <Button v-if="!isShowing.attachments" class="flex-auto" @click="handleShowAttachments">
          <Octicon name="plus-circle" class="mr-2" />
          Add Attachment(s)
        </Button>
        <Button v-if="!isShowing.tags" class="flex-auto" @click="handleShowTags">
          <Octicon name="plus-circle" class="mr-2" />
          Add Tag(s)
        </Button>
      </aside>

      <footer class="color-bg-default p-3 mb-n3 ml-n3 mr-n3 border-top" style="position: sticky; bottom: 0;">
        <div class="form-group my-0">
          <button type="submit" :disabled="!isValid || isLoading" class="btn btn-primary btn-block">Add Entry</button>
          <progress v-if="isLoading" style="width: 100%;" />
        </div>
      </footer>
    </form>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, reactive, ref, watch } from 'vue'

import { events, Entry, NewEntity, Attachment, getSuggestedPlantName, usePlants, useCrops, useBeds, useTags } from '../services/data'
import { database, getUserRefPath, ServerValue, storage } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import TreeViewSelectMenu from '../components/TreeViewSelectMenu.vue'
import PlantTreeView from '../components/PlantTreeView.vue'
import TransitionExpand from '../components/TreeView/TransitionExpand.vue'
import Button from '../components/Button.vue'
import Octicon from '../components/Octicon.vue'
import SelectMenu from '../components/SelectMenu.vue'

const WEIGHT_SPLIT = {
  ALL: 'total',
  EACH: 'each',
}
function round(number: number, numDecimals: number = 2) {
  const multiplier = 10 ** numDecimals
  return Math.round(number * multiplier + Number.EPSILON) / multiplier
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
async function uploadAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Attachment must be under 10MB (${file.name})`)
  }
  // if (!file.type.startsWith('image/')) throw new Error('Attachment must be an image')
  const fileKey = database.ref().push().key
  const ref = storage.ref(getUserRefPath(`/attachments/${fileKey}`))
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
  attachments,
  tagIds,
}: {
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
    note: note || null,
    attachments: attachments || null,
    tagIds: tagIds?.length && tagIds || null,
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
    TreeViewSelectMenu,
    PlantTreeView,
    TransitionExpand,
    Button,
    Octicon,
    SelectMenu,
  },
  setup() {
    const plantIds = ref<string[]>([])
    const eventId = ref<string>()
    const note = ref<string>()
    const beds = useBeds()
    const newBedIds = ref<string[]>([])
    const isNewBedIdsSelectOpen = ref(false)
    watch(newBedIds, (v) => {
      if (v.length) {
        isNewBedIdsSelectOpen.value = false
      }
    })
    const newName = ref<string>()
    const plants = usePlants()
    const crops = useCrops()
    const cropId = computed(() => plants.value?.find(({ id }) => id === plantIds.value?.[0])?.cropId)
    const newNamePlaceholder = computed(() => getSuggestedPlantName(cropId.value, crops.value, plants.value))
    const weight = ref<string>()
    const weightUnit = ref<string>('g')
    const weightSplit = ref<string>(WEIGHT_SPLIT.ALL)
    const cullToo = ref(false)
    const at = ref<string>()
    const files = ref<FileList>()
    const tags = useTags()
    const tagIds = ref<string[]>([])

    const isShowing = reactive({
      at: false,
      attachments: false,
      tags: false,
    })
    const atRef = ref<HTMLInputElement>()
    const attachmentsRef = ref<HTMLInputElement>()
    const tagIdsRef = ref<HTMLInputElement>()
    function handleShowAt() {
      isShowing.at = true
      window.setTimeout(() => atRef.value?.focus?.())
    }
    function handleShowAttachments() {
      isShowing.attachments = true
      window.setTimeout(() => attachmentsRef.value?.click?.())
    }
    function handleShowTags() {
      isShowing.tags = true
      window.setTimeout(() => tagIdsRef.value?.querySelector('summary')?.click())
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
      formRef.value?.reset()
    }
    const toast = inject<Function>('toast')
    const [runAsync, isLoading] = useAsyncWrapper()
    async function handleSubmit() {
      await runAsync(async () => {
        const individualWeight = weight.value
          ? (
            weightSplit.value === WEIGHT_SPLIT.ALL
              ? round(Number.parseFloat(weight.value) / plantIds.value.length)
              : Number.parseFloat(weight.value)
          )
          : undefined

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
      })

      handleReset()
    }

    return {
      WEIGHT_SPLIT,
      isAddingPlant: inject('isAddingPlant'),
      isAddingBed: inject('isAddingBed'),
      isAddingTag: inject('isAddingTag'),
      isEditingTag: inject('isEditingTag'),

      plants,
      plantIds,
      eventId,
      note,
      at,
      files,
      events,
      featuredEvents: events.filter(({ featured }) => featured),
      beds,
      newBedIds,
      isNewBedIdsSelectOpen,
      newName,
      newNamePlaceholder,
      weight,
      weightUnit,
      weightSplit,
      cullToo,
      tags,
      tagIds,

      isShowing,
      atRef,
      attachmentsRef,
      tagIdsRef,
      handleShowAt,
      handleShowAttachments,
      handleShowTags,

      formRef,
      isValid,
      isLoading,

      handleReset,
      handleSubmit,
    }
  },
})
</script>