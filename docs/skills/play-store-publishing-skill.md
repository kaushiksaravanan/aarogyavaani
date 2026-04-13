# Play Store Publishing Skill

Use this instruction file when an AI agent needs to publish the Android app.

## Mission

Navigate Play Console safely, update the release, upload the AAB, add release notes, verify data safety status, and move the release to the correct track.

## Required inputs

- developer id
- app id
- target track
- built AAB path
- release notes
- privacy policy URL

## Operating rules

1. Prefer stable selectors such as `debug-id`.
2. Keep the target tab focused before final publish actions.
3. Verify current page state before each destructive or irreversible step.
4. Do not invent answers for data safety, content rating, or permissions.
5. Stop if the app id, developer id, or release track looks wrong.
6. Never commit signing keys or store credentials into the repo.

## Publishing flow

1. Open Play Console app dashboard.
2. Navigate to the correct testing or production track.
3. Create or edit the release.
4. Upload the AAB via file input.
5. Fill release notes.
6. Advance through validation steps.
7. Confirm publishing action only after verifying track and version.
8. Record resulting status and URL.

## Data safety flow

1. Open app content / data privacy section.
2. Confirm the app's actual data collection behavior.
3. Import CSV or fill the form manually.
4. Save and verify completed state.

## Output expected from the agent

- release track used
- version uploaded
- publishing status
- any blocking warnings
- final console URL
