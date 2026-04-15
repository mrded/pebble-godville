#include "rendering.h"
#include "stage_assets.h"

static GodvilleHero s_hero;
static Layer *s_scene_layer;

static void scene_update_proc(Layer *layer, GContext *ctx) {
  render_scene(layer, ctx, &s_hero);
}

void rendering_init(Window *window) {
  Layer *root = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(root);
  s_scene_layer = layer_create(bounds);
  layer_set_update_proc(s_scene_layer, scene_update_proc);
  layer_add_child(root, s_scene_layer);
}

void rendering_deinit(void) {
  if (s_scene_layer) {
    layer_destroy(s_scene_layer);
    s_scene_layer = NULL;
  }
}

void rendering_update_hero(const GodvilleHero *hero) {
  s_hero = *hero;
  if (s_scene_layer) {
    layer_mark_dirty(s_scene_layer);
  }
}

void render_scene(Layer *layer, GContext *ctx, const GodvilleHero *hero) {
  HeroStage stage = infer_hero_stage(hero);
  GBitmap *stage_bmp = get_stage_bitmap(stage);

  if (stage_bmp) {
    GRect bounds = layer_get_bounds(layer);
    graphics_draw_bitmap_in_rect(ctx, stage_bmp, bounds);
  }

  // TODO: Render hero sprite animation from hero_strip.png
  // TODO: Render pet overlay when hero has a pet companion
  // TODO: Render enemy overlay during arena_fight
  // TODO: Render HP bar proportional to (hero->hp / hero->max_hp)
  // TODO: Render hero->diary_last as a text line at the bottom of the screen
}
