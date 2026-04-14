# pebble-godville

Godville client for the [Pebble](https://www.pebble.com/) smartwatch.

[Godville](https://en.wikipedia.org/wiki/Godville) is a zero-player RPG game where you play the role of a god guiding your hero through adventures.

[![Build Status](https://travis-ci.org/mrded/pebble-godville.svg?branch=master)](https://travis-ci.org/mrded/pebble-godville)

## Features

- Displays your hero's name, level, and class
- Shows current health and max health
- Shows experience progress percentage
- Shows gold amount
- Shows current quest and progress
- Shows current hero activity / diary entry
- Auto-refreshes every 5 minutes

## Setup

1. Install the app on your Pebble using the Pebble mobile app
2. Open the Pebble app on your phone and go to Settings for Godville
3. Enter your hero's name
4. The app will fetch and display your hero's stats

## Building

Install [Pebble SDK](https://developer.pebble.com/sdk/) then run:

```bash
pebble build
```

## License

MIT
