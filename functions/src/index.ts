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

async function syncEntry({ userId, plantId, entryId }, entry) {
  const path = `/users/${userId}/_entries/${entryId}`
  const $entry = entry ? {
    '_plantId': plantId,
    ...entry,
  } : null
  return db.ref(path).set($entry)
}

export const entryModified = functions.database.ref('/users/{userId}/plants/{plantId}/entries/{entryId}')
  .onWrite(async ({ after }, ctx) => {
    const entry = after.val()
    const { userId, plantId, entryId } = ctx.params
    await syncEntry({ userId, plantId, entryId }, entry)
  })

export const syncEntries = functions.https.onRequest(async (req, res) => {
  const { userId } = req.query
  if (userId) {
    let count = 0;
    const plants = (await db.ref(`/users/${userId}/plants`).once('value')).val()
    await Promise.all(Object.entries(plants || {}).map(async ([plantId, plant]: [any, any]) => {
      await Promise.all(Object.entries(plant?.entries || {}).map(async ([entryId, entry]) => {
        await syncEntry({ userId, plantId, entryId }, entry)
        count += 1
      }))
    }))
    res.send({ count })
    return
  }
  res.status(400).send({ error: 'invalid query param: userId' })
})
