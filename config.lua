Config = {}

--- The name under the title on the loading screen.
Config.ServerName = 'Wraith Core RedM'

--- Seconds after the player's first spawn before the loading screen is dropped on its own if
--- nothing dismissed it (w_creators dismisses it when the selection is ready; this is only a
--- guard so a broken resource can never leave a player stuck behind it).
Config.SafetyTimeout = 90

-- ════════════════════════════════════════════════════════════════════════════
-- Language
--
-- There is no language setting here: the library (w_lib) controls the system language.
--
--   * The loading screen (html/index.html) is drawn while the player is still connecting,
--     before any client script runs and before the player's saved choice (KVP) can be read.
--     The only source available at that moment is the server convar `w_lib:locale`
--     (server.cfg: setr w_lib:locale "ar"), so server/main.lua hands the page the texts of
--     that language through the connection handover. Anything other than 'ar' is 'en'.
--   * The curtain (html/overlay.html) runs inside the client VM once the library is up, so it
--     uses the library key (the player's choice when set, otherwise the same convar) and
--     re-renders on 'w_lib:setLocale'.
--
-- Every text of both pages lives in locales/ar.json and locales/en.json:
--   curtain.*        the curtain lines (keys passed to exports.w_loading:Show(key))
--   screen.*         the loading screen (welcome line, phases, tip label, build line)
--   tips.*           the tips rotated on the loading screen (add a key to add a tip)
-- ════════════════════════════════════════════════════════════════════════════
