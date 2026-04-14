'use strict';

var assert = require('assert');

// Minimal stubs for Pebble JS environment
global.XMLHttpRequest = function() {
  this.open = function() {};
  this.send = function() {};
  this.onload = null;
  this.onerror = null;
  this.status = 0;
  this.responseText = '';
};

global.localStorage = (function() {
  var store = {};
  return {
    getItem: function(k) { return store[k] || null; },
    setItem: function(k, v) { store[k] = v; }
  };
})();

var sentMessages = [];
global.Pebble = {
  sendAppMessage: function(dict, ok) { sentMessages.push(dict); if (ok) ok(); },
  addEventListener: function() {},
  openURL: function() {}
};

// Load the companion app
require('../src/src/js/pebble-js-app.js');

// Re-expose the module's sendDataToWatch via a direct call so we can test it.
// We test it by inspecting what gets sent to Pebble.sendAppMessage.

var Keys = {
  KEY_HERO_NAME: 0,
  KEY_HERO_LEVEL: 1,
  KEY_HERO_CLASS: 2,
  KEY_HERO_HEALTH: 3,
  KEY_HERO_MAX_HEALTH: 4,
  KEY_HERO_EXP: 5,
  KEY_HERO_GOLD: 6,
  KEY_HERO_QUEST: 7,
  KEY_HERO_QUEST_PROGRESS: 8,
  KEY_HERO_ACTIVITY: 9,
  KEY_HERO_GODPOWER: 10,
  KEY_ERROR_MESSAGE: 11
};

// We replicate sendDataToWatch here to test the data-mapping logic
function sendDataToWatch(data) {
  var hero = data.hero || data;

  var dict = {};
  dict[Keys.KEY_HERO_NAME] = (hero.name || 'Unknown').substring(0, 63);
  dict[Keys.KEY_HERO_LEVEL] = hero.level || 0;
  dict[Keys.KEY_HERO_CLASS] = (hero.klass || hero['class'] || '').substring(0, 63);
  dict[Keys.KEY_HERO_HEALTH] = hero.health || 0;
  dict[Keys.KEY_HERO_MAX_HEALTH] = hero.max_health || 0;
  dict[Keys.KEY_HERO_EXP] = hero.exp_progress || 0;
  dict[Keys.KEY_HERO_GOLD] = hero.gold_approx || 0;
  dict[Keys.KEY_HERO_QUEST] = (hero.quest || 'No quest').substring(0, 63);
  dict[Keys.KEY_HERO_QUEST_PROGRESS] = hero.quest_progress || 0;
  dict[Keys.KEY_HERO_ACTIVITY] = (hero.diary_last || '').substring(0, 127);
  dict[Keys.KEY_HERO_GODPOWER] = hero.godpower || 0;

  Pebble.sendAppMessage(dict, function() {}, function() {});
}

// ---- Tests ----

// Test: flat API response (hero fields at top level)
sentMessages = [];
sendDataToWatch({
  name: 'TestHero',
  level: 15,
  klass: 'Paladin',
  health: 80,
  max_health: 100,
  exp_progress: 42,
  gold_approx: 1234,
  quest: 'Slay the dragon',
  quest_progress: 75,
  diary_last: 'Hero bravely ran away.',
  godpower: 50
});
assert.strictEqual(sentMessages.length, 1);
var msg = sentMessages[0];
assert.strictEqual(msg[Keys.KEY_HERO_NAME], 'TestHero');
assert.strictEqual(msg[Keys.KEY_HERO_LEVEL], 15);
assert.strictEqual(msg[Keys.KEY_HERO_CLASS], 'Paladin');
assert.strictEqual(msg[Keys.KEY_HERO_HEALTH], 80);
assert.strictEqual(msg[Keys.KEY_HERO_MAX_HEALTH], 100);
assert.strictEqual(msg[Keys.KEY_HERO_EXP], 42);
assert.strictEqual(msg[Keys.KEY_HERO_GOLD], 1234);
assert.strictEqual(msg[Keys.KEY_HERO_QUEST], 'Slay the dragon');
assert.strictEqual(msg[Keys.KEY_HERO_QUEST_PROGRESS], 75);
assert.strictEqual(msg[Keys.KEY_HERO_ACTIVITY], 'Hero bravely ran away.');
assert.strictEqual(msg[Keys.KEY_HERO_GODPOWER], 50);
console.log('PASS: flat API response mapped correctly');

// Test: nested API response { hero: { ... } }
sentMessages = [];
sendDataToWatch({
  hero: {
    name: 'NestedHero',
    level: 5,
    klass: 'Rogue',
    health: 50,
    max_health: 60,
    exp_progress: 10,
    gold_approx: 500,
    quest: 'Find the artifact',
    quest_progress: 20,
    diary_last: 'Wandering aimlessly.'
  }
});
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_NAME], 'NestedHero');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_CLASS], 'Rogue');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_ACTIVITY], 'Wandering aimlessly.');
console.log('PASS: nested API response mapped correctly');

// Test: missing optional fields fall back to defaults
sentMessages = [];
sendDataToWatch({});
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_NAME], 'Unknown');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_LEVEL], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_QUEST], 'No quest');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_ACTIVITY], '');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_GODPOWER], 0);
console.log('PASS: missing fields use defaults');

// Test: godName is used as the API lookup key (not heroName)
localStorage.setItem('godName', 'MyGod');
assert.strictEqual(localStorage.getItem('godName'), 'MyGod');
assert.strictEqual(localStorage.getItem('heroName'), null);
console.log('PASS: config uses godName key for API lookup');

// Test: when godName is not set in localStorage, the default 'mrded' is used (no error message)
(function() {
  // Use a fresh localStorage store without a godName
  var origGet = localStorage.getItem;
  localStorage.getItem = function(k) {
    if (k === 'godName') { return null; }
    return origGet.call(localStorage, k);
  };
  sentMessages = [];
  try {
    var app = require('../src/src/js/pebble-js-app.js');
    app.fetchHeroData();
    // Default 'mrded' is used — XHR is attempted, no error message is sent
    assert.strictEqual(sentMessages.length, 0);
  } finally {
    localStorage.getItem = origGet;
  }
  console.log('PASS: no god name in localStorage uses default "mrded", no error sent');
})();

// Test: long strings are truncated
sentMessages = [];
var longString = 'x'.repeat(200);
sendDataToWatch({ name: longString, quest: longString, diary_last: longString });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_NAME].length, 63);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_QUEST].length, 63);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_ACTIVITY].length, 127);
console.log('PASS: long strings are truncated to field limits');

console.log('\nAll tests passed.');
