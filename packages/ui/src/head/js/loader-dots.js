/**
 * Animate "loading..." dots via JS — cross-browser safe.
 *
 * CSS `content` animation via @keyframes is not supported in
 * Firefox or Safari. Instead we cycle a data attribute and let
 * CSS read it via `attr(data-cp-loader-text)`.
 *
 * Stores the interval ID on window so ThemeProvider can clear it
 * when dismissing the loader.
 */
;(function () {
  var frames = ['loading', 'loading.', 'loading..', 'loading...']
  var idx = 0
  document.documentElement.dataset.zpLoaderText = frames[0]
  window.__zpDotsInterval = setInterval(function () {
    idx = (idx + 1) % 4
    document.documentElement.dataset.zpLoaderText = frames[idx]
  }, 300)
})()
