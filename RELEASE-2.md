# Sick and Twisted 2 release

This project has its own Sites identity in .openai/hosting.json. The previous game's configuration is preserved locally in .openai/hosting.previous-account.json.

The six historical PNG portraits in source-art/blood-outlaws/ were moved out of dist to fit the hosting archive limit. The game loads the current WebP portraits from dist/assets/ink-western/ through blood-outlaws.js. No runtime code or active artwork was changed.

All 19 existing test files passed during launch preparation on September 22, 2026. Physical phone and Safari testing were not performed in this launch task.
