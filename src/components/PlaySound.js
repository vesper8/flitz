module.exports = function (audio, vol) {
  if (vol === undefined) vol = 1
  if (audio === undefined) audio = 'move.ogg'

  const pref = JSON.parse(localStorage.getItem('player')) || {}
  const sound = new Audio('/audio/' + audio)
  sound.vol = vol

  if (pref.sound) {
    var playPromise = sound.play()

    if (playPromise !== undefined) {
      playPromise.then(_ => {
        // Automatic playback started!
        // Show playing UI.
      })
        .catch(error => {
          console.log(error)
        // Auto-play was prevented
        // Show paused UI.
        })
    }
  }
}
