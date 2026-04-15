#include "hero_state.h"

HeroStage infer_hero_stage(const GodvilleHero *hero) {
  if (hero->has_savings)             return HERO_STAGE_ENDGAME;
  if (hero->has_ark_completed_at)    return HERO_STAGE_ARK_DONE;
  if (hero->has_wood)                return HERO_STAGE_ARK_BUILDING;
  if (hero->has_temple_completed_at) return HERO_STAGE_TEMPLE_DONE;
  if (hero->has_bricks)              return HERO_STAGE_TEMPLE_BUILDING;
  if (hero->has_pet)                 return HERO_STAGE_PET;
  return HERO_STAGE_EARLY;
}

ActivityState infer_activity_state(const GodvilleHero *hero) {
  if (hero->hp <= 0)          return ACTIVITY_DEAD;
  if (hero->arena_fight)      return ACTIVITY_FIGHTING;
  if (hero->town_name[0] != '\0') return ACTIVITY_TOWN;
  if (hero->distance > 0)     return ACTIVITY_TRAVELLING;
  return ACTIVITY_IDLE;
}
