function setPublicReadCache(res) {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
}

function setMapCache(res) {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
}

function setNoStore(res) {
  res.set('Cache-Control', 'no-store')
}

function setPrivateNoStore(res) {
  res.set('Cache-Control', 'private, no-store')
}

module.exports = {
  setPublicReadCache,
  setMapCache,
  setNoStore,
  setPrivateNoStore,
}
