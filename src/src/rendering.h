#pragma once

#include <pebble.h>
#include "hero_state.h"

// Create the scene layer, attach it to the window's root layer, and register
// the update callback.  Call this early in main_window_load so that text
// layers added afterwards are rendered on top of the background.
void rendering_init(Window *window);

// Destroy the scene layer.  Call from main_window_unload.
void rendering_deinit(void);

// Store a copy of the latest hero snapshot and mark the scene layer dirty so
// it redraws on the next frame.  Call whenever new data arrives from the
// companion app.
void rendering_update_hero(const GodvilleHero *hero);

// Core drawing function.  Renders the stage background for the hero's current
// stage.  Exposed for testing and future reuse; normally called internally
// by the scene layer's update_proc.
void render_scene(Layer *layer, GContext *ctx, const GodvilleHero *hero);
