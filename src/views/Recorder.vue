<template>
  <div class="Recorder">
    <AddPlant v-if="isAdding" style="margin: 32px;" />
    <form @submit.prevent="handleSubmit">
      <fieldset>
        <label>
          Plant(s)
          <button type="button" @click="isAdding = !isAdding">Add Plant</button>
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

      <fieldset>
        <label>When</label>
        <input type="datetime-local" v-model="at" />
      </fieldset>

      <fieldset>
        <label>Note</label>
        <textarea v-model="note"></textarea>
      </fieldset>

      <fieldset>
        <button type="submit" :disabled="!plantIds.length || !eventId">Add Entry</button>
      </fieldset>
    </form>
    <pre>{{plantIds}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import { events } from '../services/data'
import { database, ServerValue } from '../services/firebase'
import AddPlant from '../components/AddPlant.vue'
import PlantTreeView from '../components/PlantTreeView.vue'
import { Entry } from '../data'

export default defineComponent({
  name: 'Recorder',
  components: {
    AddPlant,
    PlantTreeView,
  },
  setup() {
    const isAdding = ref(false)
    const plantIds = ref<string[]>([])
    const eventId = ref<string>()
    const at = ref<string>()
    const note = ref<string>()


    return {
      isAdding,
      plantIds,
      eventId,
      at,
      note,

      events,

      async handleSubmit() {
        await Promise.all(plantIds.value.map(async (plantId) => {
          await database.ref(`/users/mismith/plants/${plantId}/entries`).push({
            eventId: eventId.value,
            at: at.value ? new Date(at.value).valueOf() : ServerValue.TIMESTAMP,
            // payload,
            note: note.value || null,
            createdAt: ServerValue.TIMESTAMP,
          } as Omit<Entry, 'id' | 'createdAt'>)
        }))
        plantIds.value = []
      },
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

    fieldset {
      display: flex;
      flex-direction: column;

      textarea {
        resize: vertical;
      }
    }
  }
}
</style>