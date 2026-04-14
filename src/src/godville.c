#include <pebble.h>

#define KEY_HERO_NAME         0
#define KEY_HERO_LEVEL        1
#define KEY_HERO_CLASS        2
#define KEY_HERO_HEALTH       3
#define KEY_HERO_MAX_HEALTH   4
#define KEY_HERO_EXP          5
#define KEY_HERO_GOLD         6
#define KEY_HERO_QUEST        7
#define KEY_HERO_QUEST_PROGRESS 8
#define KEY_HERO_ACTIVITY     9
#define KEY_HERO_GODPOWER     10

static Window *s_main_window;

static TextLayer *s_name_layer;
static TextLayer *s_level_class_layer;
static TextLayer *s_health_layer;
static TextLayer *s_exp_layer;
static TextLayer *s_gold_layer;
static TextLayer *s_godpower_layer;
static TextLayer *s_quest_layer;
static TextLayer *s_activity_layer;

static char s_name_buf[64];
static char s_level_class_buf[64];
static char s_health_buf[32];
static char s_exp_buf[32];
static char s_gold_buf[32];
static char s_godpower_buf[32];
static char s_quest_buf[128];
static char s_activity_buf[128];

static void inbox_received_handler(DictionaryIterator *iter, void *context) {
  Tuple *name_t = dict_find(iter, KEY_HERO_NAME);
  Tuple *level_t = dict_find(iter, KEY_HERO_LEVEL);
  Tuple *class_t = dict_find(iter, KEY_HERO_CLASS);
  Tuple *health_t = dict_find(iter, KEY_HERO_HEALTH);
  Tuple *max_health_t = dict_find(iter, KEY_HERO_MAX_HEALTH);
  Tuple *exp_t = dict_find(iter, KEY_HERO_EXP);
  Tuple *gold_t = dict_find(iter, KEY_HERO_GOLD);
  Tuple *quest_t = dict_find(iter, KEY_HERO_QUEST);
  Tuple *quest_prog_t = dict_find(iter, KEY_HERO_QUEST_PROGRESS);
  Tuple *activity_t = dict_find(iter, KEY_HERO_ACTIVITY);
  Tuple *godpower_t = dict_find(iter, KEY_HERO_GODPOWER);

  if (name_t) {
    snprintf(s_name_buf, sizeof(s_name_buf), "%s", name_t->value->cstring);
    text_layer_set_text(s_name_layer, s_name_buf);
  }

  if (level_t && class_t) {
    snprintf(s_level_class_buf, sizeof(s_level_class_buf),
             "Lv %d %s", (int)level_t->value->int32, class_t->value->cstring);
    text_layer_set_text(s_level_class_layer, s_level_class_buf);
  }

  if (health_t && max_health_t) {
    snprintf(s_health_buf, sizeof(s_health_buf),
             "HP: %d/%d", (int)health_t->value->int32, (int)max_health_t->value->int32);
    text_layer_set_text(s_health_layer, s_health_buf);
  }

  if (exp_t) {
    snprintf(s_exp_buf, sizeof(s_exp_buf), "EXP: %d%%", (int)exp_t->value->int32);
    text_layer_set_text(s_exp_layer, s_exp_buf);
  }

  if (gold_t) {
    snprintf(s_gold_buf, sizeof(s_gold_buf), "Gold: %d", (int)gold_t->value->int32);
    text_layer_set_text(s_gold_layer, s_gold_buf);
  }

  if (godpower_t) {
    snprintf(s_godpower_buf, sizeof(s_godpower_buf), "GP: %d%%", (int)godpower_t->value->int32);
    text_layer_set_text(s_godpower_layer, s_godpower_buf);
  }

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

  int y = 2;
  int line_height = 18;
  int width = bounds.size.w - 4;

  s_name_layer = text_layer_create(GRect(2, y, width, 22));
  text_layer_set_font(s_name_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  text_layer_set_text(s_name_layer, "Loading...");
  layer_add_child(window_layer, text_layer_get_layer(s_name_layer));
  y += 22;

  s_level_class_layer = text_layer_create(GRect(2, y, width, line_height));
  text_layer_set_font(s_level_class_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_level_class_layer));
  y += line_height;

  s_health_layer = text_layer_create(GRect(2, y, width, line_height));
  text_layer_set_font(s_health_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_health_layer));
  y += line_height;

  s_exp_layer = text_layer_create(GRect(2, y, width, line_height));
  text_layer_set_font(s_exp_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_exp_layer));
  y += line_height;

  s_gold_layer = text_layer_create(GRect(2, y, width, line_height));
  text_layer_set_font(s_gold_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_gold_layer));
  y += line_height;

  s_godpower_layer = text_layer_create(GRect(2, y, width, line_height));
  text_layer_set_font(s_godpower_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_layer, text_layer_get_layer(s_godpower_layer));
  y += line_height;

  s_quest_layer = text_layer_create(GRect(2, y, width, line_height * 2));
  text_layer_set_font(s_quest_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  text_layer_set_overflow_mode(s_quest_layer, GTextOverflowModeWordWrap);
  layer_add_child(window_layer, text_layer_get_layer(s_quest_layer));
  y += line_height * 2;

  s_activity_layer = text_layer_create(GRect(2, y, width, bounds.size.h - y - 2));
  text_layer_set_font(s_activity_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD));
  text_layer_set_overflow_mode(s_activity_layer, GTextOverflowModeWordWrap);
  layer_add_child(window_layer, text_layer_get_layer(s_activity_layer));
}

static void main_window_unload(Window *window) {
  text_layer_destroy(s_name_layer);
  text_layer_destroy(s_level_class_layer);
  text_layer_destroy(s_health_layer);
  text_layer_destroy(s_exp_layer);
  text_layer_destroy(s_gold_layer);
  text_layer_destroy(s_godpower_layer);
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

  app_message_register_inbox_received(inbox_received_handler);
  app_message_register_inbox_dropped(inbox_dropped_handler);
  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());
}

static void deinit(void) {
  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
