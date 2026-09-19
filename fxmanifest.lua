fx_version 'cerulean'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
lua54 'yes'

name 'w_loading'
author 'Wraith Studio'
version '1.1.0'
description 'Wraith Core loading screen, and the loading curtain drawn between character selection, creation and the spawn'

-- ════════════════════════════════════════════════════════════════════════════
-- Two pages, one identity (ink, paper textures and RDR typography):
--
--   html/index.html    the loading screen shown from the moment the player connects. It stays
--                      up (loadscreen_manual_shutdown) until w_creators has the character
--                      selection ready and drops it -- so the world is never seen underneath.
--                      Its texts arrive through the connection handover (server/main.lua) in
--                      the server language (convar w_lib:locale).
--   html/overlay.html  the loading curtain: exports.w_loading:Show(key) / Hide(). w_creators'
--                      fade helpers draw it over every transition (selection -> creator ->
--                      spawn), so the player sees a loading card, never a black screen. Its
--                      texts come from the library dictionary (locales/ar.json, en.json).
-- ════════════════════════════════════════════════════════════════════════════

dependency 'w_lib'

loadscreen 'html/index.html'
loadscreen_manual_shutdown 'yes'
loadscreen_cursor 'no'

ui_page 'html/overlay.html'

files {
    'html/index.html',
    'html/overlay.html',
    'html/*.css',
    'html/*.js',
    'html/fonts/*.woff2',
    'html/img/*',
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
