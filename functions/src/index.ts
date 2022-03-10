import { initializeApp } from 'firebase-admin'
import { getDatabase } from 'firebase-admin/database'
import * as functions from 'firebase-functions'

function isEmulator() {
  return Boolean(process.env.FUNCTIONS_EMULATOR)
}

const app = initializeApp()
if (isEmulator()) {
  functions.app.setEmulatedAdminApp(app)
}

const db = getDatabase(app)

async function get(userId, collection, id) {
  return (await db.ref(`/users/${userId}/${collection}/${id}`).get()).val()
}
// async function getUserCollectionsData(userId) {
//   const collections = [
//     'plants',
//     'beds',
//     'plots',
//     'crops',
//     'tags',
//   ]
//   const snaps = collections.map((collection) => db.ref(`/users/${userId}/${collection}`).get())
//   return (await Promise.all(snaps)).reduce((acc, snap, i) => {
//     acc[collections[i]] = snap.val()
//     return acc
//   }, {} as Record<string, any>)
// }
const transforms = {
  async entry(userId, entry) {
    if (!entry) return null

    const _entry = { ...entry }
    if (entry._plantId) {
      _entry._plant = await transforms.plant(userId, await get(userId, 'plants', entry._plantId))
    }
    if (entry.payload?.oldBedId) {
      _entry.payload._oldBed = await transforms.bed(userId, await get(userId, 'beds', entry.payload.oldBedId))
    }
    if (entry.payload?.newBedId) {
      _entry.payload._newBed = await transforms.bed(userId, await get(userId, 'beds', entry.payload.newBedId))
    }
    if (entry.payload?.oldPlantId) {
      _entry.payload._oldPlant = await transforms.plant(userId, await get(userId, 'plants', entry.payload.oldPlantId))
    }
    if (entry.payload?.newPlantId) {
      _entry.payload._newPlant = await transforms.plant(userId, await get(userId, 'plants', entry.payload.newPlantId))
    }
    if (entry.tagIds) {
      _entry._tags = await Promise.all(entry.tagIds.map(async (tagId) => transforms.tag(userId, await get(userId, 'tags', tagId))))
    }
    return _entry
  },
  async plant(userId, plant) {
    if (!plant) return null

    const _plant = { ...plant }
    if (plant.cropId) {
      _plant._crop = await transforms.crop(userId, await get(userId, 'crops', plant.cropId))
    }
    if (plant.bedId) {
      _plant._bed = await transforms.bed(userId, await get(userId, 'beds', plant.bedId))
    }
    delete _plant.entries
    return _plant
  },
  async bed(userId, bed) {
    if (!bed) return null

    const _bed = { ...bed }
    if (bed.plotId) {
      _bed._plot = await transforms.plot(userId, await get(userId, 'plots', bed.plotId))
    }
    return _bed
  },
  async plot(userId, plot) {
    if (!plot) return null

    const _plot = { ...plot }
    if (plot.parentPlotId) {
      _plot._parentPlot = await transforms.plot(userId, await get(userId, 'plots', plot.parentPlotId))
    }
    return _plot
  },
  async crop(userId, crop) {
    if (!crop) return null

    const _crop = { ...crop }
    return _crop
  },
  async tag(userId, tag) {
    if (!tag) return null

    const _tag = { ...tag }
    return _tag
  },
}

export const entryModified = functions.database.ref('/users/{userId}/plants/{plantId}/entries/{entryId}')
  .onWrite(async ({ after }, ctx) => {
    // @TODO: debounce?
    const entry = after.val()
    const { userId, plantId, entryId } = ctx.params

    const _entry = await transforms.entry(userId, { _plantId: plantId, ...entry })

    await db.ref(`/users/${userId}/_entries/${entryId}`).set(_entry)
  })

export const syncEntries = functions.https.onRequest(async (req, res) => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).send({ error: 'invalid query param: userId' })
    return
  }

  const start = Date.now()

  const plants = (await db.ref(`/users/${userId}/plants`).get()).val()
  const _entries = {}
  await Promise.all(Object.entries(plants || {}).map(async ([plantId, plant]: [any, any]) => {
    await Promise.all(Object.entries(plant?.entries || {}).map(async ([entryId, entry]: [any, any]) => {
      _entries[entryId] = await transforms.entry(userId, { _plantId: plantId, ...entry })
    }))
  }))

  await db.ref(`/users/${userId}/_entries`).set(_entries)

  const elapsed = Date.now() - start
  res.send({ count: Object.keys(_entries).length, elapsed })
})
