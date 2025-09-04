# TODO

## Nice to have

- [ ] Create a script that takes current `inList` stat for a station and uses the popularity calculator to convert it to play minutes and rewrite it to the database
- [ ] Better station adding — allow changing of station name when adding a station (would need to change database update to not overwrite the database entry with station name header)
- [ ] Option to "minimize" a user's list to prevent users from having to scroll past it to get to search results (need to figure out "how" and "where" to place the toggle)
- [ ] Save playing station to localstorage. when playing stops remove that entry. if an entry exists on page load. use it to start a new play session.

## Before next release

- [ ] Test WorkOS session timeout "feels" correct. once logged in user should be logged in (30 day session max) unless new docker instance or user logs out.

## Done

- [x] Script that generates translation files
- [x] User menu — login button when logged out, logout button when logged in
- [x] Set up WorkOS production environment
- [x] refactor header so that user menu is not hidden on mobile. maybe shift input block right to allow space for use of the button. refactor js to have seperate behavior for the buttons