#pragma once

#include <pebble.h>
#include "hero_state.h"

// Load all stage background bitmaps into memory.
// Call once during app init, after the window is created.
void load_stage_assets(void);

// Destroy all stage background bitmaps and free their memory.
// Call during app deinit.
void unload_stage_assets(void);

// Return the GBitmap for the given stage.  If the stage is out of range the
// EARLY stage bitmap is returned as a fallback.  Returns NULL if
// load_stage_assets() has not been called yet or the underlying resource
// failed to load.
GBitmap *get_stage_bitmap(HeroStage stage);
