var GODVILLE_API_URL = 'https://godvillegame.com/gods/api/';
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
  KEY_HERO_ACTIVITY: 9
};

function fetchHeroData() {
  var heroName = localStorage.getItem('heroName');
  if (!heroName) {
    console.log('No hero name set. Configure the app first.');
    return;
  }

  var url = GODVILLE_API_URL + encodeURIComponent(heroName) + '.json';

  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        sendDataToWatch(data);
      } catch (e) {
        console.log('Failed to parse Godville API response: ' + e);
      }
    } else {
      console.log('Godville API request failed: ' + xhr.status);
    }
  };
  xhr.onerror = function() {
    console.log('Network error when fetching Godville data');
  };
  xhr.send();
}

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
  dict[Keys.KEY_HERO_ACTIVITY] = (hero.diary_last || hero.activatable || '').substring(0, 127);

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
  var heroName = localStorage.getItem('heroName') || '';
  var configUrl = 'data:text/html,' + encodeURIComponent(
    '<html><body>' +
    '<h3>Godville Hero</h3>' +
    '<label>Hero name: <input id="name" value="' + heroName + '"></label><br><br>' +
    '<button onclick="' +
      'var n=document.getElementById(\'name\').value;' +
      'location.href=\'pebblejs://close#\'+encodeURIComponent(JSON.stringify({heroName:n}));' +
    '">Save</button>' +
    '</body></html>'
  );
  Pebble.openURL(configUrl);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response) {
    try {
      var config = JSON.parse(decodeURIComponent(e.response));
      if (config.heroName) {
        localStorage.setItem('heroName', config.heroName);
        console.log('Hero name saved: ' + config.heroName);
        fetchHeroData();
      }
    } catch (err) {
      console.log('Failed to parse configuration: ' + err);
    }
  }
});
