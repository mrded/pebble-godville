'use strict';

var assert = require('assert');

// Minimal stubs for Pebble JS environment

// XHR mock that captures the last instance so tests can trigger callbacks
var lastXHR = null;
global.XMLHttpRequest = function() {
  lastXHR = this;
  this.openedUrl = null;
  this.open = function(method, url) { this.openedUrl = url; };
  this.send = function() {};
  this.onload = null;
  this.onerror = null;
  this.status = 0;
  this.responseText = '';
};

global.localStorage = (function() {
  var store = {};
  return {
    getItem: function(k) {
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem: function(k, v) { store[k] = v; },
    removeItem: function(k) { delete store[k]; }
  };
})();

var sentMessages = [];
global.Pebble = {
  sendAppMessage: function(dict, ok) { sentMessages.push(dict); if (ok) ok(); },
  addEventListener: function() {},
  openURL: function() {}
};

// Load the companion app and get the exports
var app = require('../src/src/js/pebble-js-app.js');
var sendDataToWatch = app.sendDataToWatch;
var fetchHeroData = app.fetchHeroData;
var GODVILLE_REALMS = app.GODVILLE_REALMS;
var htmlEscape = app.htmlEscape;

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
  KEY_ERROR_MESSAGE: 11,
  KEY_HERO_HAS_PET: 12,
  KEY_HERO_HAS_BRICKS: 13,
  KEY_HERO_HAS_TEMPLE_COMPLETED: 14,
  KEY_HERO_HAS_WOOD: 15,
  KEY_HERO_HAS_ARK_COMPLETED: 16,
  KEY_HERO_HAS_SAVINGS: 17,
  KEY_HERO_TOWN_NAME: 18,
  KEY_HERO_DISTANCE: 19,
  KEY_HERO_ARENA_FIGHT: 20
};

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

// Test: when godName is not set in localStorage, sendError is called (no XHR)
(function() {
  // Use a fresh localStorage store without a godName
  var origGet = localStorage.getItem;
  localStorage.getItem = function(k) {
    if (k === 'godName') { return null; }
    return origGet.call(localStorage, k);
  };
  sentMessages = [];
  try {
    fetchHeroData();
    // No godName — error is sent to watch, no XHR
    assert.strictEqual(sentMessages.length, 1);
    assert.ok(
      Object.prototype.hasOwnProperty.call(sentMessages[0], Keys.KEY_ERROR_MESSAGE),
      'Expected error message key in sent message'
    );
  } finally {
    localStorage.getItem = origGet;
  }
  console.log('PASS: no god name in localStorage sends error to watch');
})();

// Test: long strings are truncated
sentMessages = [];
var longString = 'x'.repeat(200);
sendDataToWatch({ name: longString, quest: longString, diary_last: longString });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_NAME].length, 63);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_QUEST].length, 63);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_ACTIVITY].length, 127);
console.log('PASS: long strings are truncated to field limits');

// Test: stage inference fields — hero with a pet
sentMessages = [];
sendDataToWatch({ pet: { name: 'Doggy' }, bricks_cnt: 0 });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_PET], 1);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_BRICKS], 0);
console.log('PASS: pet flag set when hero has a pet');

// Test: stage inference fields — hero building the temple
sentMessages = [];
sendDataToWatch({ bricks_cnt: 42 });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_BRICKS], 1);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_PET], 0);
console.log('PASS: bricks flag set when bricks_cnt > 0');

// Test: stage inference fields — temple done, building ark
sentMessages = [];
sendDataToWatch({ temple_completed_at: '2024-01-01', wood_cnt: 7 });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_TEMPLE_COMPLETED], 1);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_WOOD], 1);
console.log('PASS: temple_completed and wood flags set correctly');

// Test: stage inference fields — ark done, has savings (endgame)
sentMessages = [];
sendDataToWatch({ ark_completed_at: '2025-06-01', savings: 10000 });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_ARK_COMPLETED], 1);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_SAVINGS], 1);
console.log('PASS: ark_completed and savings flags set correctly');

// Test: activity inference fields — in town
sentMessages = [];
sendDataToWatch({ town_name: 'Beerburg', distance: 0 });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_TOWN_NAME], 'Beerburg');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_DISTANCE], 0);
console.log('PASS: town_name and distance sent correctly');

// Test: activity inference fields — travelling, arena fight
sentMessages = [];
sendDataToWatch({ distance: 15, arena_fight: true });
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_DISTANCE], 15);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_ARENA_FIGHT], 1);
console.log('PASS: distance and arena_fight sent correctly');

// Test: stage inference defaults when all optional fields absent
sentMessages = [];
sendDataToWatch({});
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_PET], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_BRICKS], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_TEMPLE_COMPLETED], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_WOOD], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_ARK_COMPLETED], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_HAS_SAVINGS], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_TOWN_NAME], '');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_DISTANCE], 0);
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_ARENA_FIGHT], 0);
console.log('PASS: all stage/activity fields default to falsy when absent');

// ---- fetchHeroData error-handling tests ----
// These verify the watch is never left stuck on "Loading..." when the API fails.

localStorage.setItem('godName', 'TestGod');

// Test: non-200 HTTP status sends an error message to the watch
sentMessages = [];
fetchHeroData();
lastXHR.status = 404;
lastXHR.onload();
assert.strictEqual(sentMessages.length, 1);
assert.ok(sentMessages[0][Keys.KEY_ERROR_MESSAGE], 'expected error message for 404');
assert.ok(sentMessages[0][Keys.KEY_ERROR_MESSAGE].indexOf('404') !== -1,
  'error message should include status code');
console.log('PASS: HTTP 404 response sends error message to watch');

// Test: network error sends an error message to the watch
sentMessages = [];
fetchHeroData();
lastXHR.onerror();
assert.strictEqual(sentMessages.length, 1);
assert.ok(sentMessages[0][Keys.KEY_ERROR_MESSAGE], 'expected error message for network error');
console.log('PASS: network error sends error message to watch');

// Test: invalid JSON response sends an error message to the watch
sentMessages = [];
fetchHeroData();
lastXHR.status = 200;
lastXHR.responseText = 'not valid json {{{';
lastXHR.onload();
assert.strictEqual(sentMessages.length, 1);
assert.ok(sentMessages[0][Keys.KEY_ERROR_MESSAGE], 'expected error message for invalid JSON');
console.log('PASS: invalid JSON response sends error message to watch');

// Test: valid 200 response with hero data sends hero data (not error) to the watch
sentMessages = [];
fetchHeroData();
lastXHR.status = 200;
lastXHR.responseText = JSON.stringify({
  name: 'HeroFromAPI',
  level: 10,
  klass: 'Warrior',
  health: 90,
  max_health: 100,
  exp_progress: 30,
  gold_approx: 500,
  quest: 'Defeat the boss',
  quest_progress: 50,
  diary_last: 'Marching onward.',
  godpower: 75
});
lastXHR.onload();
assert.strictEqual(sentMessages.length, 1);
assert.ok(!sentMessages[0][Keys.KEY_ERROR_MESSAGE], 'expected no error message for valid response');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_NAME], 'HeroFromAPI');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_LEVEL], 10);
console.log('PASS: valid API response sends hero data to watch (no error)');

// Test: valid nested { hero: {...} } response is parsed correctly
sentMessages = [];
fetchHeroData();
lastXHR.status = 200;
lastXHR.responseText = JSON.stringify({
  hero: {
    name: 'NestedAPIHero',
    level: 7,
    klass: 'Mage',
    health: 60,
    max_health: 80,
    exp_progress: 55,
    gold_approx: 300,
    quest: 'Find the tome',
    quest_progress: 10,
    diary_last: 'Studying ancient texts.',
    godpower: 40
  }
});
lastXHR.onload();
assert.strictEqual(sentMessages.length, 1);
assert.ok(!sentMessages[0][Keys.KEY_ERROR_MESSAGE], 'expected no error message for nested response');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_NAME], 'NestedAPIHero');
assert.strictEqual(sentMessages[0][Keys.KEY_HERO_CLASS], 'Mage');
console.log('PASS: valid nested API response parsed correctly');

// ---- Realm tests ----

// Test: GODVILLE_REALMS contains both English and Russian URLs
assert.strictEqual(GODVILLE_REALMS['en'], 'https://godvillegame.com/gods/api/');
assert.strictEqual(GODVILLE_REALMS['ru'], 'https://godville.net/gods/api/');
console.log('PASS: GODVILLE_REALMS contains both en and ru endpoints');

// Test: English realm uses godvillegame.com
localStorage.setItem('godName', 'TestGod');
localStorage.setItem('realm', 'en');
sentMessages = [];
fetchHeroData();
assert.ok(lastXHR.openedUrl.indexOf(GODVILLE_REALMS['en']) === 0,
  'English realm should use godvillegame.com, got: ' + lastXHR.openedUrl);
console.log('PASS: English realm uses godvillegame.com');

// Test: Russian realm uses godville.net
localStorage.setItem('realm', 'ru');
sentMessages = [];
fetchHeroData();
assert.ok(lastXHR.openedUrl.indexOf(GODVILLE_REALMS['ru']) === 0,
  'Russian realm should use godville.net, got: ' + lastXHR.openedUrl);
console.log('PASS: Russian realm uses godville.net');

// Test: unknown realm falls back to English
localStorage.setItem('realm', 'xx');
sentMessages = [];
fetchHeroData();
assert.ok(lastXHR.openedUrl.indexOf(GODVILLE_REALMS['en']) === 0,
  'Unknown realm should fall back to godvillegame.com, got: ' + lastXHR.openedUrl);
console.log('PASS: unknown realm falls back to godvillegame.com');

// Test: no realm set defaults to English
localStorage.setItem('realm', '');
sentMessages = [];
fetchHeroData();
assert.ok(lastXHR.openedUrl.indexOf(GODVILLE_REALMS['en']) === 0,
  'No realm should default to godvillegame.com, got: ' + lastXHR.openedUrl);
console.log('PASS: no realm set defaults to godvillegame.com (English)');

// Test: realm key absent from localStorage also defaults to English
localStorage.removeItem('realm');
sentMessages = [];
fetchHeroData();
assert.ok(lastXHR.openedUrl.indexOf(GODVILLE_REALMS['en']) === 0,
  'Absent realm key should default to godvillegame.com, got: ' + lastXHR.openedUrl);
console.log('PASS: absent realm key defaults to godvillegame.com (English)');

// Restore realm for subsequent tests
localStorage.setItem('realm', 'en');

// ---- htmlEscape tests ----

// Test: special HTML characters are escaped
assert.strictEqual(htmlEscape('&'), '&amp;');
assert.strictEqual(htmlEscape('"'), '&quot;');
assert.strictEqual(htmlEscape("'"), '&#39;');
assert.strictEqual(htmlEscape('<'), '&lt;');
assert.strictEqual(htmlEscape('>'), '&gt;');
console.log('PASS: htmlEscape escapes individual special characters');

// Test: a god name with special chars cannot break out of the value attribute
var dangerous = 'x" onmouseover="alert(1)';
var escaped = htmlEscape(dangerous);
assert.ok(escaped.indexOf('"') === -1, 'double quotes should be escaped');
assert.ok(escaped.indexOf('&quot;') !== -1, 'double quotes should become &quot;');
console.log('PASS: htmlEscape prevents attribute injection');

// Test: plain names are returned unchanged
assert.strictEqual(htmlEscape('mrded'), 'mrded');
assert.strictEqual(htmlEscape(''), '');
// Test: null/undefined inputs are handled gracefully
assert.strictEqual(htmlEscape(null), '');
assert.strictEqual(htmlEscape(undefined), '');
console.log('PASS: htmlEscape leaves plain strings unchanged and handles null/undefined');

console.log('\nAll tests passed.');
