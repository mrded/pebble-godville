#pragma once

#include <pebble.h>

// Stages of the hero's overall progression through the game.
typedef enum {
  HERO_STAGE_EARLY = 0,      // No pet, no bricks, no temple
  HERO_STAGE_PET,            // Has a pet companion
  HERO_STAGE_TEMPLE_BUILDING,// Collecting bricks for the temple
  HERO_STAGE_TEMPLE_DONE,    // Temple completed
  HERO_STAGE_ARK_BUILDING,   // Collecting wood for the Ark
  HERO_STAGE_ARK_DONE,       // Ark completed
  HERO_STAGE_ENDGAME,        // Hero has savings (post-Ark)
  HERO_STAGE_COUNT
} HeroStage;

// What the hero is doing right now.
typedef enum {
  ACTIVITY_IDLE = 0,
  ACTIVITY_FIGHTING,
  ACTIVITY_TRAVELLING,
  ACTIVITY_TOWN,
  ACTIVITY_DEAD
} ActivityState;

// Snapshot of hero data sent from the Godville API via the JS companion.
// Boolean flags use the has_* convention to represent optional API fields.
typedef struct {
  int  hp;
  int  max_hp;
  int  level;
  bool arena_fight;
  char diary_last[128];
  char town_name[64];
  int  distance;
  bool has_pet;
  bool has_bricks;
  bool has_temple_completed_at;
  bool has_wood;
  bool has_ark_completed_at;
  bool has_savings;
} GodvilleHero;

// Infer the hero's overall progression stage from a hero snapshot.
HeroStage infer_hero_stage(const GodvilleHero *hero);

// Infer the hero's current activity from a hero snapshot.
ActivityState infer_activity_state(const GodvilleHero *hero);
