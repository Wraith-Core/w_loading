-- The loading screen cannot read convars, the player's saved language or their name on its
-- own: the Cfx runtime hands it a table through the connection deferrals (window.nuiHandoverData in the
-- page). Every other playerConnecting handler (the queue) keeps working; handover data is per
-- connection. The language is the library's server key (see config.lua).

local loadedKey = nil

---'ar' or 'en' from the library (w.getLocaleKey() reads the w_lib:locale convar on the
---server); anything else is 'en'.
---@return string
local function serverLocale()
    local ok, key = pcall(function() return w.getLocaleKey() end)
    return (ok and key == 'ar') and 'ar' or 'en'
end

---The strings the loading screen needs, in the server language: the flat `screen.*` entries
---and the `tips.*` entries as a list (sorted by key so the order is stable).
---@return string key, table<string, string> strings, string[] tips
local function screenStrings()
    local key = serverLocale()

    -- the dictionary was loaded at start for the convar; reload if the convar changed since
    if key ~= loadedKey then
        w.locale(key)
        loadedKey = key
    end

    local dict = w.getLocales()
    local strings, tipKeys = {}, {}

    for k, v in pairs(dict) do
        if k:sub(1, 7) == 'screen.' then
            strings[k] = v
        elseif k:sub(1, 5) == 'tips.' then
            tipKeys[#tipKeys + 1] = k
        end
    end

    table.sort(tipKeys)

    local tips = {}
    for i = 1, #tipKeys do
        tips[i] = dict[tipKeys[i]]
    end

    return key, strings, tips
end

---Config.Plates as a plain list of ids (anything else is dropped; empty = every plate).
---@return string[]
local function plateIds()
    local ids = {}
    if type(Config.Plates) == 'table' then
        for _, id in ipairs(Config.Plates) do
            if type(id) == 'string' and id ~= '' then ids[#ids + 1] = id end
        end
    end
    return ids
end

AddEventHandler('playerConnecting', function(name, _, deferrals)
    local key, strings, tips = screenStrings()
    local plates = plateIds()

    deferrals.handover({
        wl_name    = name,
        wl_server  = Config.ServerName,
        wl_locale  = key,
        wl_dir     = key == 'ar' and 'rtl' or 'ltr',
        wl_strings = strings,
        wl_tips    = tips,
        wl_build   = GetConvar('sv_enforceGameBuild', ''),
        wl_contact = type(Config.ContactEmail) == 'string' and Config.ContactEmail or '',
        wl_plates  = #plates > 0 and plates or nil,
    })
end)
