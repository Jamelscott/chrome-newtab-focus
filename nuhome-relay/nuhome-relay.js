// Synchronous redirect relay.
// Chrome steals omnibox focus for this (the registered new-tab) page.
// Because the redirect fires before that steal resolves, nuhome-page.html
// loads without Chrome touching the omnibox, so urlBarInput.focus() wins.
location.replace("../nuhome-page/nuhome-page.html");
