var GODVILLE_REALMS = {
  'en': 'https://godvillegame.com/gods/api/',
  'ru': 'https://godville.net/gods/api/'
};
var UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

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

function htmlEscape(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sendError(message) {
  var errDict = {};
  errDict[Keys.KEY_ERROR_MESSAGE] = message;
  Pebble.sendAppMessage(errDict, function() {
    console.log('Error message sent to Pebble');
  }, function(error) {
    console.log('Failed to send error message: ' + JSON.stringify(error));
  });
}

function fetchHeroData() {
  // TODO: Remove default god name before release
  var godName = localStorage.getItem('godName') || 'mrded';
  if (!godName) {
    console.log('No god name set. Configure the app first.');
    sendError('Set god name in Settings');
    return;
  }

  var realm = localStorage.getItem('realm') || 'en';
  var apiUrl = GODVILLE_REALMS[realm] || GODVILLE_REALMS['en'];
  var url = apiUrl + encodeURIComponent(godName) + '.json';

  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        sendDataToWatch(data);
      } catch (e) {
        console.log('Failed to parse Godville API response: ' + e);
        sendError('Invalid API response');
      }
    } else {
      console.log('Godville API request failed: ' + xhr.status);
      sendError('API error: ' + xhr.status);
    }
  };
  xhr.onerror = function() {
    console.log('Network error when fetching Godville data');
    sendError('Network error');
  };
  xhr.send();
}

function sendDataToWatch(data) {
  var hero = data.hero || data;

  var dict = {};
  dict[Keys.KEY_HERO_NAME]           = (hero.name || 'Unknown').substring(0, 63);
  dict[Keys.KEY_HERO_LEVEL]          = hero.level || 0;
  dict[Keys.KEY_HERO_CLASS]          = (hero.klass || hero['class'] || '').substring(0, 63);
  dict[Keys.KEY_HERO_HEALTH]         = hero.health || 0;
  dict[Keys.KEY_HERO_MAX_HEALTH]     = hero.max_health || 0;
  dict[Keys.KEY_HERO_EXP]            = hero.exp_progress || 0;
  dict[Keys.KEY_HERO_GOLD]           = hero.gold_approx || 0;
  dict[Keys.KEY_HERO_QUEST]          = (hero.quest || 'No quest').substring(0, 63);
  dict[Keys.KEY_HERO_QUEST_PROGRESS] = hero.quest_progress || 0;
  dict[Keys.KEY_HERO_ACTIVITY]       = (hero.diary_last || '').substring(0, 127);
  dict[Keys.KEY_HERO_GODPOWER]       = hero.godpower || 0;

  // Stage inference fields
  dict[Keys.KEY_HERO_HAS_PET]              = hero.pet ? 1 : 0;
  dict[Keys.KEY_HERO_HAS_BRICKS]           = (hero.bricks_cnt > 0) ? 1 : 0;
  dict[Keys.KEY_HERO_HAS_TEMPLE_COMPLETED] = hero.temple_completed_at ? 1 : 0;
  dict[Keys.KEY_HERO_HAS_WOOD]             = (hero.wood_cnt > 0) ? 1 : 0;
  dict[Keys.KEY_HERO_HAS_ARK_COMPLETED]    = hero.ark_completed_at ? 1 : 0;
  dict[Keys.KEY_HERO_HAS_SAVINGS]          = (hero.savings > 0) ? 1 : 0;
  dict[Keys.KEY_HERO_TOWN_NAME]            = (hero.town_name || '').substring(0, 63);
  dict[Keys.KEY_HERO_DISTANCE]             = hero.distance || 0;
  dict[Keys.KEY_HERO_ARENA_FIGHT]          = hero.arena_fight ? 1 : 0;

  Pebble.sendAppMessage(dict, function() {
    console.log('Data sent to Pebble successfully');
  }, function(error) {
    console.log('Failed to send data to Pebble: ' + JSON.stringify(error));
  });
}

Pebble.addEventListener('ready', function() {
  console.log('PebbleKit JS ready');
  fetchHeroData();
  setInterval(fetchHeroData, UPDATE_INTERVAL);
});

Pebble.addEventListener('showConfiguration', function() {
  var godName = localStorage.getItem('godName') || '';
  var realm = localStorage.getItem('realm') || 'en';
  var configUrl = 'data:text/html,' + encodeURIComponent(
    '<html><body>' +
    '<h3>Godville</h3>' +
    '<label>God name: <input id="name" value="' + htmlEscape(godName) + '"></label><br><br>' +
    '<label>Realm: <select id="realm">' +
      '<option value="en"' + (realm === 'en' ? ' selected' : '') + '>English (godvillegame.com)</option>' +
      '<option value="ru"' + (realm === 'ru' ? ' selected' : '') + '>Russian (godville.net)</option>' +
    '</select></label><br><br>' +
    '<button onclick="' +
      'var n=document.getElementById(\'name\').value;' +
      'var r=document.getElementById(\'realm\').value;' +
      'location.href=\'pebblejs://close#\'+encodeURIComponent(JSON.stringify({godName:n,realm:r}));' +
    '">Save</button>' +
    '</body></html>'
  );
  Pebble.openURL(configUrl);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response) {
    try {
      var config = JSON.parse(decodeURIComponent(e.response));
      var changed = false;
      if (config.godName) {
        localStorage.setItem('godName', config.godName);
        console.log('God name saved: ' + config.godName);
        changed = true;
      }
      if (config.realm && GODVILLE_REALMS[config.realm]) {
        localStorage.setItem('realm', config.realm);
        console.log('Realm saved: ' + config.realm);
        changed = true;
      }
      if (changed) {
        fetchHeroData();
      }
    } catch (err) {
      console.log('Failed to parse configuration: ' + err);
    }
  }
});

if (typeof module !== 'undefined') {
  module.exports = { fetchHeroData: fetchHeroData, sendDataToWatch: sendDataToWatch, GODVILLE_REALMS: GODVILLE_REALMS, htmlEscape: htmlEscape };
}
