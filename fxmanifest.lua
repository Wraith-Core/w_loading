fx_version 'cerulean'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
lua54 'yes'

name 'w_loading'
author 'Wraith Studio'
version '2.0.6'
description 'Red River loading screen ("The Survey Plates"), and the loading curtain drawn between character selection, creation and the spawn'

-- ════════════════════════════════════════════════════════════════════════════
-- Two pages, one identity (ink and paper in black and white, RDR typography, one red):
--
--   html/index.html    the loading screen shown from the moment the player connects: real
--                      survey photographs of the 1860s-70s West (public domain / CC0, credited
--                      on screen and in CREDITS.md), the name as the only mark, tips, honest
--                      progress and period music. It stays up (loadscreen_manual_shutdown) until
--                      w_creators has the character selection ready and drops it -- so the
--                      world is never seen underneath. Its texts arrive through the connection
--                      handover (server/main.lua) in the server language (convar w_lib:locale).
--   html/overlay.html  the loading curtain: exports.w_loading:Show(key) / Hide(). w_creators'
--                      fade helpers draw it over every transition (selection -> creator ->
--                      spawn), so the player sees a loading card, never a black screen. Its
--                      texts come from the library dictionary (locales/ar.json, en.json).
--   html/tokens.css    the palette, the fonts and the type roles both pages share.
-- ════════════════════════════════════════════════════════════════════════════

dependency 'w_lib'

loadscreen 'html/index.html'
loadscreen_manual_shutdown 'yes'
loadscreen_cursor 'yes'

ui_page 'html/overlay.html'

files {
    'html/index.html',
    'html/overlay.html',
    'html/tokens.css',
    'html/loading.css',
    'html/overlay.css',
    'html/plates.js',
    'html/loading.js',
    'html/overlay.js',
    'html/fonts/*.woff2',
    'html/fonts/*.txt',     -- the OFL licences travel with the fonts they cover
    'html/img/pm-grain.png',
    'html/img/plates/*.jpg',
    'html/music/*.ogg',
    'locales/*.json',
}

shared_scripts {
    '@w_lib/init.lua',
    'config.lua',
}

-- the dictionary is loaded at start on both sides
w_lib { 'locale' }

client_script 'client/main.lua'
server_script 'server/main.lua'

escrow_ignore {
    'config.lua',
    'html/**/*',
    'locales/*.json',
}
