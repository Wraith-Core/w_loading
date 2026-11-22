# w_loading

Red Dead survey-plate loading screen with period music, tips, progress indicator, and a seamless transition curtain for **Wraith Framework RedM**.

## Key Features

- Historic 1860s–1870s public-domain Western survey photographs (credited in [CREDITS.md](CREDITS.md)) with smooth crossfades and period music toggle.
- Manual loading screen shutdown (`Dismiss`) so the world never flashes before character selection is ready.
- Built-in transition curtain (`Show` / `Hide`) used between character selection, creation, and spawn.
- Easy branding via `server.cfg` convars — no HTML/JS editing required.

## Configuration (`server.cfg`)

```cfg
setr w_loading:serverName "My RedM Server"
setr w_loading:brandLatin "MY SERVER"
setr w_loading:brandArabic "MY SERVER"
```

## Client Exports

```lua
exports.w_loading:Show('spawn')
exports.w_loading:Hide()
exports.w_loading:Dismiss()
local shown = exports.w_loading:IsShown()
```

## Documentation & Links

- **Developer Docs:** https://wraith-core.github.io/docs/#/resources/interface-world
- **txAdmin Recipe:** https://github.com/Wraith-Core/txAdminRecipe
- **Credits & Public-Domain Sources:** See [CREDITS.md](CREDITS.md)
