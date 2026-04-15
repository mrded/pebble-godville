#include "stage_assets.h"

// NOTE: Place the matching PNG files in src/resources/ and ensure
//       the appinfo.json "media" array contains an entry for each name
//       (e.g. {"type":"bitmap","name":"STAGE_EARLY_HERO","file":"stage_early_hero.png"})
//       before building.  The RESOURCE_ID_* constants below are generated
//       automatically by the Pebble SDK from those appinfo.json entries.

static GBitmap *s_stage_bitmaps[HERO_STAGE_COUNT];

void load_stage_assets(void) {
  s_stage_bitmaps[HERO_STAGE_EARLY]           = gbitmap_create_with_resource(RESOURCE_ID_STAGE_EARLY_HERO);
  s_stage_bitmaps[HERO_STAGE_PET]             = gbitmap_create_with_resource(RESOURCE_ID_STAGE_WITH_PET);
  s_stage_bitmaps[HERO_STAGE_TEMPLE_BUILDING] = gbitmap_create_with_resource(RESOURCE_ID_STAGE_BUILDING_TEMPLE);
  s_stage_bitmaps[HERO_STAGE_TEMPLE_DONE]     = gbitmap_create_with_resource(RESOURCE_ID_STAGE_TEMPLE_COMPLETE);
  s_stage_bitmaps[HERO_STAGE_ARK_BUILDING]    = gbitmap_create_with_resource(RESOURCE_ID_STAGE_ARK_BUILDING);
  s_stage_bitmaps[HERO_STAGE_ARK_DONE]        = gbitmap_create_with_resource(RESOURCE_ID_STAGE_ARK_COMPLETE);
  s_stage_bitmaps[HERO_STAGE_ENDGAME]         = gbitmap_create_with_resource(RESOURCE_ID_STAGE_ENDGAME);
}

void unload_stage_assets(void) {
  for (int i = 0; i < HERO_STAGE_COUNT; i++) {
    if (s_stage_bitmaps[i]) {
      gbitmap_destroy(s_stage_bitmaps[i]);
      s_stage_bitmaps[i] = NULL;
    }
  }
}

GBitmap *get_stage_bitmap(HeroStage stage) {
  // Out-of-range stages fall back to EARLY; either may still be NULL if
  // load_stage_assets() has not been called or the resource failed to load.
  if (stage >= 0 && stage < HERO_STAGE_COUNT) {
    return s_stage_bitmaps[stage];
  }
  return s_stage_bitmaps[HERO_STAGE_EARLY];
}
