# ustfighters

## Instructions, Description

## TODO

From assessment guidelines:
- Add game description and instructions (to front page, and maybe to this file)
- Add more game objects? (recommended: at least 4, current: 1 (players) or maybe 2/3 (if attack boxes count separately / HP bars count))
- Add/improve game over screen: result of game (win/tie/lose instead of "player X wins"), relevant stats (e.g. remaining health of both players), button to return to front page
- Add sounds? (recommended: at least 2, current: 0)

Improvements/bugfixes:
- Can make cheat mode more powerful? (currently it seems to only negate all incoming damage)
- Can detect gameover from the timer running out (currently, timer running out only calls the determineWinner function and has no effect on running the game (which is in the gameFrame function))
- Can allow game animation to run a bit longer after one player is defeated, to show the "death" animation (this feature was present in the original but no longer works because the current end game detection scripts also stop all game animations)

## Potential other ideas (only if time allows)
- Damage splash text?
- More attacks? (maybe some that use extra sprites? maybe some that have durations of effect? maybe some that affect attributes other than health, like movement speed?)
- Attack cooldown / some implementation of "mana"/"charge"?
- Ways to rank players? e.g. winning margin? time used? experience points system?
- Can allow players to join a new game after finishing their current one?

##
### Changelog

2024-11-26: Original version.

2024-11-27 (AM):
- Added/uploaded `server.js`, `data/users.json`, `public/index.html`, `public/style.css`, and these files inside `public/scripts`: `authentication.js`, `registration.js`, `main_functions.js`, `socket.js`, `basegame.js` and (these are mostly for reference only) `sprite.js`, `bounding_box.js`, `player.js`.
- Copied `classes.js` and `mechanism.js` into `public/scripts`, as well as the `img` folder into `public`.
- Merged the two `index.html` files: assigned id to the outermost container `<div>` of the game area, put it (and its contents) after the `main_page` `<div>` in place of the original `<canvas>` and added tag to hide the whole game area upon loading the page.
- Updated `style.css` to use the new fonts (but also retained the font styles in the front page, for now, since the new font doesn't seem to render hyphens properly, and the given font size was too big).
- Merged functions in `index.js` into `basegame.js` (mostly in the `initialiseGame` function).
- Moved the canvas setup functions from `index.js` into `mechanism.js` (placed at the end of `body` and should load after it, unlike most other scripts that are placed in `head` which would then load before the canvas is loaded, causing an error).
- Moved `timer` declaration from `mechanism.js` to `initialiseGame` so it can be reset every time a game loads.
- Changed cheat mode activation: previously was hold-down-button, changed to toggle (can revert if needed)

2024-11-27 (PM):
- Changed this readme file.
