<template>
  <div class="Recorder">
    <form @submit.prevent="handleSubmit">

      <fieldset>
        <label>When</label>
        <input type="datetime-local" v-model="record.when" />
      </fieldset>

      <fieldset>
        <label>What</label>
        <select v-model="record.what" multiple>
          <option
            v-for="event in events"
            :key="event.id"
            :value="event.id"
          >
            {{event.id}}
          </option>
        </select>
      </fieldset>

      <!-- <fieldset>
        <label>Who</label>
        <select v-model="record.who" multiple>
          <option
            v-for="crop in crops"
            :key="crop.id"
            :value="crop.id"
          >
            {{crop.id}}: {{crop.name}}
          </option>
        </select>
      </fieldset> -->

      <fieldset>
        <label>Where</label>
        <select v-model="record.where" multiple>
          <template
            v-for="plot in plots"
            :key="plot.id"
          >
            <option
              :value="[{ type: 'plot', id: plot.id }]"
            >
              {{plot.id}}
            </option>
            <option
              v-for="bed in plot.beds"
              :key="bed.id"
              :value="[{ type: 'plot', id: plot.id }, { type: 'bed', id: bed.id }]"
            >
              &nbsp;&nbsp;&nbsp;&nbsp;{{bed.id}}
            </option>
          </template>
        </select>
      </fieldset>

      <fieldset>
        <label>How</label>
        <textarea v-model="record.how"></textarea>
      </fieldset>

      <fieldset>
        <button type="submit">Submit</button>
      </fieldset>
    </form>

    <pre>{{record}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'

import data from '../data'

export default defineComponent({
  name: 'Recorder',
  setup() {
    const record = reactive({
      when: undefined,
      what: [],
      where: [],
      how: undefined,
    })

    return {
      ...data,
      record,
      handleSubmit() {
        // if (!record.datetime) {
        //   record.datetime = new Date();
        // }
        console.log(record);
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