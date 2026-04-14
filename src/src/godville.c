#include <pebble.h>

#define KEY_HERO_NAME           0
#define KEY_HERO_LEVEL          1
#define KEY_HERO_CLASS          2
#define KEY_HERO_HEALTH         3
#define KEY_HERO_MAX_HEALTH     4
#define KEY_HERO_EXP            5
#define KEY_HERO_GOLD           6
#define KEY_HERO_QUEST          7
#define KEY_HERO_QUEST_PROGRESS 8
#define KEY_HERO_ACTIVITY       9
#define KEY_HERO_GODPOWER       10
#define KEY_ERROR_MESSAGE       11
#define KEY_HERO_ALIGNMENT      12
#define BAR_LEN                  6  // width of Pokemon-style progress bars

static Window *s_main_window;

static TextLayer *s_time_layer;
static TextLayer *s_name_layer;
static TextLayer *s_level_class_layer;
static TextLayer *s_stats_layer;      // HP + EXP on one line
static TextLayer *s_resources_layer;  // Gold + GP on one line
static TextLayer *s_quest_layer;
static TextLayer *s_activity_layer;

static char s_time_buf[8];
static char s_name_buf[64];
static char s_level_class_buf[80]; // "Lv NNN ClassName (alignment)" + null
static char s_alignment_buf[32];
static char s_stats_buf[48];
static char s_resources_buf[48];
static char s_quest_buf[128];
static char s_activity_buf[128];

// Raw values kept so combined rows rebuild correctly on partial updates
static int s_health = 0, s_max_health = 0, s_exp = 0;
static int s_gold = 0, s_godpower = 0;

// Build a Pokemon-style progress bar: "######...." (BAR_LEN chars, # filled, . empty)
static void build_bar(char *buf, int value, int max) {
  if (max <= 0) max = 1;
  int filled = (value * BAR_LEN) / max;
  if (filled < 0) filled = 0;
  if (filled > BAR_LEN) filled = BAR_LEN;
  int i;
  for (i = 0; i < filled; i++) buf[i] = '#';
  for (; i < BAR_LEN; i++) buf[i] = '.';
  buf[BAR_LEN] = '\0';
}

static void update_stats_layer(void) {
  char hp_bar[BAR_LEN + 1];
  int hp_pct = s_max_health > 0 ? (s_health * 100) / s_max_health : 0;
  build_bar(hp_bar, s_health, s_max_health);
  // Pokemon-style: HP[######]80% XP:42%
  snprintf(s_stats_buf, sizeof(s_stats_buf),
           "HP[%s]%d%% XP:%d%%", hp_bar, hp_pct, s_exp);
  text_layer_set_text(s_stats_layer, s_stats_buf);
}

static void update_resources_layer(void) {
  char gp_bar[BAR_LEN + 1];
  build_bar(gp_bar, s_godpower, 100);
  // Pokemon-style: G:1234 GP[######]
  snprintf(s_resources_buf, sizeof(s_resources_buf),
           "G:%d GP[%s]", s_gold, gp_bar);
  text_layer_set_text(s_resources_layer, s_resources_buf);
}

static void tick_handler(struct tm *tick_time, TimeUnits units_changed) {
  strftime(s_time_buf, sizeof(s_time_buf),
           clock_is_24h_style() ? "%H:%M" : "%I:%M", tick_time);
  text_layer_set_text(s_time_layer, s_time_buf);
}

static void inbox_received_handler(DictionaryIterator *iter, void *context) {
  Tuple *error_t = dict_find(iter, KEY_ERROR_MESSAGE);
  if (error_t) {
    snprintf(s_name_buf, sizeof(s_name_buf), "%s", error_t->value->cstring);
    text_layer_set_text(s_name_layer, s_name_buf);
    text_layer_set_text(s_level_class_layer, "");
    text_layer_set_text(s_quest_layer, "");
    text_layer_set_text(s_activity_layer, "");
    return;
  }

  Tuple *name_t       = dict_find(iter, KEY_HERO_NAME);
  Tuple *level_t      = dict_find(iter, KEY_HERO_LEVEL);
  Tuple *class_t      = dict_find(iter, KEY_HERO_CLASS);
  Tuple *health_t     = dict_find(iter, KEY_HERO_HEALTH);
  Tuple *max_health_t = dict_find(iter, KEY_HERO_MAX_HEALTH);
  Tuple *exp_t        = dict_find(iter, KEY_HERO_EXP);
  Tuple *gold_t       = dict_find(iter, KEY_HERO_GOLD);
  Tuple *quest_t      = dict_find(iter, KEY_HERO_QUEST);
  Tuple *quest_prog_t = dict_find(iter, KEY_HERO_QUEST_PROGRESS);
  Tuple *activity_t   = dict_find(iter, KEY_HERO_ACTIVITY);
  Tuple *godpower_t   = dict_find(iter, KEY_HERO_GODPOWER);
  Tuple *alignment_t  = dict_find(iter, KEY_HERO_ALIGNMENT);

  if (name_t) {
    snprintf(s_name_buf, sizeof(s_name_buf), "%s", name_t->value->cstring);
    text_layer_set_text(s_name_layer, s_name_buf);
  }

  if (alignment_t) {
    snprintf(s_alignment_buf, sizeof(s_alignment_buf), "%s", alignment_t->value->cstring);
  } else {
    s_alignment_buf[0] = '\0';
  }

  if (level_t && class_t) {
    if (s_alignment_buf[0]) {
      // Pokemon-style status badge: first letter of alignment, uppercased
      char align_letter = s_alignment_buf[0];
      if (align_letter >= 'a' && align_letter <= 'z') align_letter -= 32;
      snprintf(s_level_class_buf, sizeof(s_level_class_buf),
               "Lv.%d %s [%c]",
               (int)level_t->value->int32, class_t->value->cstring, align_letter);
    } else {
      snprintf(s_level_class_buf, sizeof(s_level_class_buf),
               "Lv.%d %s", (int)level_t->value->int32, class_t->value->cstring);
    }
    text_layer_set_text(s_level_class_layer, s_level_class_buf);
  }

  bool stats_dirty = false;
  if (health_t)     { s_health     = (int)health_t->value->int32;     stats_dirty = true; }
  if (max_health_t) { s_max_health = (int)max_health_t->value->int32; stats_dirty = true; }
  if (exp_t)        { s_exp        = (int)exp_t->value->int32;        stats_dirty = true; }
  if (stats_dirty) update_stats_layer();

  bool res_dirty = false;
  if (gold_t)     { s_gold     = (int)gold_t->value->int32;     res_dirty = true; }
  if (godpower_t) { s_godpower = (int)godpower_t->value->int32; res_dirty = true; }
  if (res_dirty) update_resources_layer();

  if (quest_t && quest_prog_t) {
    snprintf(s_quest_buf, sizeof(s_quest_buf),
             "Quest: %s (%d%%)", quest_t->value->cstring, (int)quest_prog_t->value->int32);
    text_layer_set_text(s_quest_layer, s_quest_buf);
  }

  if (activity_t) {
    snprintf(s_activity_buf, sizeof(s_activity_buf), "%s", activity_t->value->cstring);
    text_layer_set_text(s_activity_layer, s_activity_buf);
  }
}

static void inbox_dropped_handler(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Message dropped: %d", reason);
}

static void main_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);
  int width = bounds.size.w - 4;
  int y = 0;

  // Time — centred, prominent
  s_time_layer = text_layer_create(GRect(0, y, bounds.size.w, 32));
  text_layer_set_font(s_time_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
  text_layer_set_text_alignment(s_time_layer, GTextAlignmentCenter);
  text_layer_set_text(s_time_layer, "00:00");
  layer_add_child(window_layer, text_layer_get_layer(s_time_layer));
  y += 32;

  // Hero name
  s_name_layer = text_layer_create(GRect(2, y, width, 20));
  text_layer_set_font(s_name_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  text_layer_set_text(s_name_layer, "Loading...");
  layer_add_child(window_layer, text_layer_get_layer(s_name_layer));
  y += 20;

  // Level + class
  s_level_class_layer = text_layer_create(GRect(2, y, width, 16));
  text_layer_set_font(s_level_class_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_level_class_layer));
  y += 16;

  // HP + EXP
  s_stats_layer = text_layer_create(GRect(2, y, width, 16));
  text_layer_set_font(s_stats_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_stats_layer));
  y += 16;

  // Gold + GP
  s_resources_layer = text_layer_create(GRect(2, y, width, 16));
  text_layer_set_font(s_resources_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_resources_layer));
  y += 16;

  // Quest (2 lines)
  s_quest_layer = text_layer_create(GRect(2, y, width, 32));
  text_layer_set_font(s_quest_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  text_layer_set_overflow_mode(s_quest_layer, GTextOverflowModeWordWrap);
  layer_add_child(window_layer, text_layer_get_layer(s_quest_layer));
  y += 32;

  // Last diary entry — fills remaining space
  s_activity_layer = text_layer_create(GRect(2, y, width, bounds.size.h - y - 2));
  text_layer_set_font(s_activity_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD));
  text_layer_set_overflow_mode(s_activity_layer, GTextOverflowModeWordWrap);
  layer_add_child(window_layer, text_layer_get_layer(s_activity_layer));

  // Show the correct time right away (don't wait for first tick)
  time_t now = time(NULL);
  tick_handler(localtime(&now), MINUTE_UNIT);

  // Initialise combined stat rows with zero values
  update_stats_layer();
  update_resources_layer();
}

static void main_window_unload(Window *window) {
  text_layer_destroy(s_time_layer);
  text_layer_destroy(s_name_layer);
  text_layer_destroy(s_level_class_layer);
  text_layer_destroy(s_stats_layer);
  text_layer_destroy(s_resources_layer);
  text_layer_destroy(s_quest_layer);
  text_layer_destroy(s_activity_layer);
}

static void init(void) {
  s_main_window = window_create();
  window_set_window_handlers(s_main_window, (WindowHandlers) {
    .load = main_window_load,
    .unload = main_window_unload
  });
  window_stack_push(s_main_window, true);

  tick_timer_service_subscribe(MINUTE_UNIT, tick_handler);

  app_message_register_inbox_received(inbox_received_handler);
  app_message_register_inbox_dropped(inbox_dropped_handler);
  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());
}

static void deinit(void) {
  tick_timer_service_unsubscribe();
  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
