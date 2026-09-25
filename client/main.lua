-- ════════════════════════════════════════════════════════════════════════════
-- w_loading · client
--   The loading curtain (html/overlay.html) and the guard on the loading screen.
--
--   exports.w_loading:Show(key | text, sub?)   draw the curtain (a curtain.* key of the
--                                              dictionary, or a plain text; `sub` is an optional
--                                              second line, translated when it is a key)
--   exports.w_loading:Hide()                    lift it
--   exports.w_loading:IsShown()
--   TriggerEvent('w_loading:show', key) / ('w_loading:hide')  -- same, for resources without exports
--   exports.w_loading:Dismiss()                 drop the loading screen with its exit fade
--                                              (or TriggerEvent('w_loading:dismiss'))
--
--   The texts follow the library language (locales/ar.json, en.json) and re-render live on
--   'w_lib:setLocale' while the curtain is up.
-- ════════════════════════════════════════════════════════════════════════════

local shown = false
local current = nil -- { key, sub } of the curtain on screen, kept for the live switch

---'ar' or 'en' from the library key; anything else is 'en'.
---@return string
local function localeKey()
    local key = w.getLocaleKey()
    return key == 'ar' and 'ar' or 'en'
end

---Translate a curtain key ('spawn' -> curtain.spawn); a text that is no key is shown as it is.
---@param key string
---@return string
local function curtainText(key)
    local id = 'curtain.' .. key
    local text = locale(id)
    if text ~= id then return text end
    return locale(key)
end

---Send the page the current lines in the current language and direction.
local function push()
    local key = localeKey()
    SendNUIMessage({
        action = 'show',
        serverName = Config.ServerName,
        text = curtainText(current.key or 'loading'),
        sub = current.sub and locale(current.sub) or nil,
        locale = key,
        dir = key == 'ar' and 'rtl' or 'ltr',
    })
end

local function show(key, sub)
    current = { key = key and tostring(key) or nil, sub = sub and tostring(sub) or nil }
    shown = true
    push()
end

local function hide()
    if not shown then return end
    shown = false
    current = nil
    SendNUIMessage({ action = 'hide' })
end

exports('Show', show)
exports('Hide', hide)
exports('IsShown', function() return shown end)

AddEventHandler('w_loading:show', function(key, sub) show(key, sub) end)
AddEventHandler('w_loading:hide', hide)

-- The player switched language: reload the dictionary (ar/en only) and redraw the curtain
-- if it is up.
AddEventHandler('w_lib:setLocale', function(key)
    w.locale(key == 'ar' and 'ar' or 'en')
    if shown and current then return push() end
    local k = localeKey()
    SendNUIMessage({ action = 'setLocale', locale = k, dir = k == 'ar' and 'rtl' or 'ltr' })
end)

-- The curtain must never outlive the resource that drew it.
AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then return end
    if shown and resource == 'w_creators' then hide() end
end)

-- ── the loading screen (html/index.html) ────────────────────────────────────
-- The page cannot see the client VM; two messages go to it with SendLoadingScreenMessage:
--   wl_ready   the client scripts are running (sent once, now): the page shows 100% and
--              "Preparing your characters" for the rest of the wait
--   wl_exit    the screen is about to be dropped: the page fades to ink and fades the music
--              out, and the screen is shut down EXIT_MS later (exports.w_loading:Dismiss())
local EXIT_MS = 800
local dismissing = false

local function screenMessage(eventName)
    pcall(SendLoadingScreenMessage, json.encode({ eventName = eventName }))
end

screenMessage('wl_ready')

---Drop the loading screen with its exit fade (both layers, the game's and the NUI one).
---Safe to call more than once, and after the screen is gone.
local function dismiss()
    if dismissing then return end
    dismissing = true
    screenMessage('wl_exit')
    SetTimeout(EXIT_MS, function()
        pcall(ShutdownLoadingScreen)
        pcall(ShutdownLoadingScreenNui)
    end)
end

exports('Dismiss', dismiss)
AddEventHandler('w_loading:dismiss', dismiss)

-- ── the guard on the loading screen ─────────────────────────────────────────
-- w_creators drops the loading screen once the character selection is ready. Should it
-- never get there (a script error, a missing resource), the player would sit behind the
-- screen forever: after the first spawn plus Config.SafetyTimeout the screen is dropped here.
-- Dropping an already dropped screen is harmless.
AddEventHandler('playerSpawned', function()
    SetTimeout((Config.SafetyTimeout or 90) * 1000, function()
        if GetResourceState('w_creators') ~= 'started' then
            w.print.warn('w_creators is not running - dropping the loading screen on the guard')
        end
        dismiss()
    end)
end)
