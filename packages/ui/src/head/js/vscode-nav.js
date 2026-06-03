/**
 * Notify parent window (VS Code webview) on SPA navigation.
 *
 * Patches pushState/replaceState and listens for popstate to detect
 * route changes. Observes <title> mutations so the VS Code tab title
 * updates after React renders the new page title.
 */
;(function () {
  var originalPush = history.pushState
  var originalReplace = history.replaceState
  var lastPath = ''

  function send(path, title) {
    if (path === lastPath && !title) return
    lastPath = path
    window.parent.postMessage(
      { type: 'ciderpress:navigate', path: path, title: title || document.title },
      '*'
    )
  }

  function notify() {
    send(location.pathname, '')
  }

  history.pushState = function () {
    originalPush.apply(this, arguments)
    notify()
  }

  history.replaceState = function () {
    originalReplace.apply(this, arguments)
    notify()
  }

  window.addEventListener('popstate', notify)

  /* Watch <title> changes so the tab title updates after React renders.
     The script may run before <title> exists in the DOM (prepended in <head>),
     so observe <head> for the <title> to appear, then switch to watching it. */
  function observeTitle(el) {
    new MutationObserver(function () {
      send(location.pathname, document.title)
    }).observe(el, { childList: true })
  }

  var titleEl = document.querySelector('title')
  if (titleEl) {
    observeTitle(titleEl)
  } else {
    new MutationObserver(function (_, headObs) {
      var t = document.querySelector('title')
      if (t) {
        headObs.disconnect()
        observeTitle(t)
        send(location.pathname, document.title)
      }
    }).observe(document.head || document.documentElement, { childList: true })
  }

  notify()
})()
