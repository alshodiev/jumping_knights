/* butterfly-manager.js - sound effects for "Butterfly and the Garden of Caissa"
 *
 * The game calls:  AudioManager.unlock(), .catch(), .bloom(), .escape(), .wrong(), .result()
 * It also runs the sound buttons on the page that have a data-audio-control attribute:
 *   effects          sound effects on / off              (🔊 / 🔇)
 *   volume           quiet mode                          (🤫 / 🔉)
 *   reduced-sensory  calmer screen: no moving garden     (🌱 / ✨)
 * Settings are remembered on this device.
 * There is no music in here on purpose: the game page plays its own garden theme.
 * All sounds are made live with Web Audio, so no sound files are needed.
 */
(function () {
  "use strict";
  var KEY = "bg_audio_settings";
  var settings = { effects: true, quiet: false, calm: false };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved) for (var k in settings) if (k in saved) settings[k] = !!saved[k]; } catch (_) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {} }

  var ac = null, out = null;
  function ctx() {
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ac = new AC(); } catch (_) { return null; }
      out = ac.createGain(); out.connect(ac.destination);
    }
    if (ac.state === "suspended") { try { ac.resume(); } catch (_) {} }
    out.gain.value = settings.quiet ? 0.35 : 1;
    return ac;
  }
  // browsers only allow sound after a tap, so get ready on the first one
  ["pointerdown", "touchend", "keydown"].forEach(function (type) { document.addEventListener(type, function () { ctx(); }, true); });
  document.addEventListener("visibilitychange", function () { if (ac && !document.hidden && ac.state === "suspended") { try { ac.resume(); } catch (_) {} } });

  function tone(freq, delay, dur, type, vol, slideTo) {
    if (!settings.effects) return;
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }

  window.AudioManager = {
    unlock: function () { return !!ctx(); },
    // a butterfly lands on the right square: a bright two-note "ding-ding"
    catch: function () { tone(784, 0, 0.18, "triangle", 0.16); tone(1175, 0.08, 0.26, "sine", 0.12); },
    // a flower blooms: a little rising sparkle
    bloom: function () { [1047, 1319, 1568].forEach(function (f, i) { tone(f, i * 0.06, 0.3, "sine", 0.08); }); },
    // a butterfly gets away: a soft sliding "whoo"
    escape: function () { tone(440, 0, 0.36, "sine", 0.08, 300); },
    // a wrong square: a gentle low "boop" (never scary)
    wrong: function () { tone(220, 0, 0.16, "triangle", 0.1, 180); },
    // level finished: a happy little fanfare
    result: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.45, "triangle", 0.13); }); }
  };

  // ---- the sound buttons
  function paint() {
    var calmOn = settings.calm;
    document.body.classList.toggle("reduced-sensory", calmOn);
    var states = { effects: settings.effects, volume: settings.quiet, "reduced-sensory": calmOn };
    Array.prototype.forEach.call(document.querySelectorAll("[data-audio-control]"), function (b) {
      var kind = b.getAttribute("data-audio-control");
      if (!(kind in states)) return;
      var on = states[kind];
      b.textContent = on ? b.getAttribute("data-audio-on") : b.getAttribute("data-audio-off");
      b.setAttribute("aria-pressed", String(on));
      var names = { effects: "Sound effects", volume: "Quiet mode", "reduced-sensory": "Calm mode" };
      b.setAttribute("aria-label", names[kind] + (on ? " on" : " off")); b.title = b.getAttribute("aria-label");
      if (kind === "effects") b.classList.toggle("off", !on);
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-audio-control]") : null;
    if (!b) return;
    var kind = b.getAttribute("data-audio-control");
    if (kind === "effects") settings.effects = !settings.effects;
    else if (kind === "volume") settings.quiet = !settings.quiet;
    else if (kind === "reduced-sensory") settings.calm = !settings.calm;
    else return;
    save(); paint(); if (ac && out) out.gain.value = settings.quiet ? 0.35 : 1;
    if (kind !== "reduced-sensory") window.AudioManager.catch();   // a little sound so you hear the change
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
})();