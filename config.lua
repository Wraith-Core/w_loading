Config = {}

--- The server's name: the title of the loading screen page and the curtain's label.
--- Override in server.cfg with `setr w_loading:serverName "My Server"`.
Config.ServerName = GetConvar('w_loading:serverName', 'Wraith Core')

--- The wordmark drawn on both the loading screen and the transition curtain.
--- Override in server.cfg with `setr w_loading:brandLatin "..."` / `setr w_loading:brandArabic "..."`.
Config.BrandLatin  = GetConvar('w_loading:brandLatin', 'WRAITH CORE')
Config.BrandArabic = GetConvar('w_loading:brandArabic', 'ريث كور')

--- A contact address shown in small type at the bottom of the loading screen, next to the
--- "not approved, sponsored, or endorsed by Rockstar Games" line. Rockstar's licence for
--- FiveM/RedM servers (PLA 2.3) asks user-facing server material to carry both, so fill it in.
--- Empty = not shown.
Config.ContactEmail = ''

--- The survey plates behind the loading screen, in playing order (the screen opens on a random
--- one and continues in this order). Remove an id to take a plate out of the rotation; the ids
--- and their credits are in html/plates.js and CREDITS.md. A plate is also skipped by itself in
--- the layout where the wordmark would cover its subject (hanging_rock is left out in Arabic).
Config.Plates = {
    'cape_horn',
    'tetons',
    'sand_hills',
    'hanging_rock',
    'mirror_lake',
    'canyon_de_chelly',
    'columbia',
}

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
--   screen.*         the loading screen (welcome line, phases, tip label, music, plate
--                    captions screen.plates.<id>.title / .credit, the licence line)
--   tips.*           the tips rotated on the loading screen (add a key to add a tip; write a
--                    key as [ESC] and it is drawn as a key cap)
-- ════════════════════════════════════════════════════════════════════════════
