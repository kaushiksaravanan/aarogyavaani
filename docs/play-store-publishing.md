# Play Store Publishing Playbook

Adapted from the proven workflow in `C:\Users\I587436\Downloads\timespin`.

## Core idea

Use browser automation plus a reproducible release checklist so publishing becomes a process, not a scramble.

## Proven rules from the reference app

- Keep the Play Console tab focused before clicking the primary publish button.
- Use stable `debug-id` selectors where available.
- Wait for visible page state changes, not only fixed timers.
- Upload AAB files through file-input automation rather than brittle coordinate hacks.
- Keep signing files and Play credentials out of git.

## Release checklist

1. Build production web assets.
2. Sync Capacitor / native project.
3. Build signed Android App Bundle.
4. Verify privacy policy URL, support email, and screenshots.
5. Update release notes.
6. Upload to internal testing first.
7. Verify store listing, content rating, and data safety.
8. Roll out wider only after install verification.

## Required project-specific values

- package id
- developer id
- app id
- aab path
- release notes
- privacy policy URL
- screenshot and feature graphic assets

## Automation reference

The `timespin` handover confirmed these patterns:
- foreground tab required for publish buttons
- Angular forms respond best to native value setters plus events
- file uploads should use direct file-input setting
- data safety form automation is feasible and repeatable

## Recommended first track

- `internal-testing`

## Files to keep local only

- keystore files
- `android/key.properties`
- Play service account credentials
- any automation session secrets
