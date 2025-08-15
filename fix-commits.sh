#!/bin/bash

# Reset to before the problematic commits
git reset --hard a25e63c

# Re-apply the changes without AI references
git cherry-pick --no-commit 5fcaca5
git commit -m "Version 1.0.65: HomeKit Temperatur-Feedback Fix

- OFF Mode zeigt jetzt korrekt 8°C statt alter Temperatur
- getTargetTemperature() überschreibt nicht mehr gesetzte Werte
- Behebt das 'Rädchen dreht ewig' Problem in Apple Home"

git cherry-pick --no-commit 3d682ce  
git commit -m "Bump version to 1.0.65"
git tag -f v1.0.65

git cherry-pick --no-commit 3b340a1
git commit -m "Version 1.0.66: OFF Mode korrekt implementiert

- OFF zeigt jetzt letzten aktiven Temperaturwert (ausgegraut)
- Beim Einschalten wird letzte Temperatur wiederhergestellt
- HomeKit-konformes Verhalten für OFF state"

git cherry-pick --no-commit ccf5a45
git commit -m "Bump version to 1.0.66"
git tag -f v1.0.66

git cherry-pick --no-commit f12b81a
git commit -m "Version 1.0.67: OFF = 253 wie in FRITZ!Box API

- OFF zeigt jetzt 253 (FRITZ!Box OFF-Wert)
- maxValue auf 253 erhöht für OFF-Unterstützung
- Kein Hack mit letzter Temperatur mehr"

git cherry-pick --no-commit c82be95
git commit -m "Bump version to 1.0.67"
git tag -f v1.0.67

git cherry-pick --no-commit dc15833
git commit -m "Version 1.0.68: OFF richtig implementiert

- maxValue wieder auf 28 (HomeKit erwartet normale Temperaturen)
- Bei OFF wird Temperaturwert NICHT aktualisiert
- Nur Heating States werden auf OFF gesetzt"

git cherry-pick --no-commit 68abce5
git commit -m "Bump version to 1.0.68"
git tag -f v1.0.68

# Apply README updates
git cherry-pick --no-commit edc8bf4
git commit -m "Update README.md with versions 1.0.64 and 1.0.65"

git cherry-pick --no-commit 5f9b3d4
git commit -m "Update README.md with version 1.0.66"

git cherry-pick --no-commit 6367fa0
git commit -m "Update README.md with version 1.0.67"

git cherry-pick --no-commit 7b46cb8
git commit -m "Update README.md mit vollständiger Versionshistorie bis 1.0.68"