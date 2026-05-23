function setPublicReadCache(res) {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
}

function setMapCache(res) {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
}

module.exports = {
  setPublicReadCache,
  setMapCache,
}
