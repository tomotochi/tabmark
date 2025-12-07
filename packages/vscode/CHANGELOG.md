# Changelog

## [0.1.2] - 2025-12-07

### Added

- Guide screen for files with invalid Tabmark structure
- Validation error messages showing specific issues
- "Open With..." button on guide screen to switch to a different editor
- "Initialize 1×1 Grid" button to create valid structure
- "Import from CSV" button on guide screen

### Changed

- Files with invalid Tabmark structure now show a helpful guide instead of failing silently

## [0.1.1] - 2025-12-07

### Fixed

- Corrected GitHub repository URLs (tomo_tochi → tomotochi)
- Auto-initialize empty `.table.md` files with 1x1 grid

### Changed

- Default sheet name changed from "sheet1" to "Sheet1"

## [0.1.0] - 2025-12-06

### Added

- Initial release of `tabmark-vscode`.
- Spreadsheet editor for `*.table.md` files.
- CSV import/export commands.
