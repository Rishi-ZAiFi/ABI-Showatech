@echo off
REM ===========================================================================
REM  Commit & push the Vitest test suite + docs to origin/main.
REM  Run from the repo root:  D:\13_claude_Code\15_bharath\01_ProductStudio
REM  (double-click, or: cmd> commit-and-push-tests.bat)
REM ===========================================================================

cd /d "%~dp0"

REM 1) Clear any stale git lock left by a crashed process (safe if absent).
if exist ".git\index.lock" del /f /q ".git\index.lock"

REM 2) Stage the test suite + docs + config + package.json.
git add ^
  src/test/setup.ts ^
  src/store/workflow.store.test.ts ^
  src/store/configurator.store.test.ts ^
  src/store/toast.store.test.ts ^
  src/services/persistence.service.test.ts ^
  src/services/file.service.test.ts ^
  src/services/cache.service.test.ts ^
  src/services/export.service.test.ts ^
  src/services/loader.service.test.ts ^
  src/utils/three.utils.test.ts ^
  src/utils/texture.utils.test.ts ^
  src/lib/utils.test.ts ^
  src/three/ModelParser.test.ts ^
  vitest.config.ts ^
  package.json ^
  TESTING.md ^
  TEST-CASES.md

REM ---------------------------------------------------------------------------
REM  NOTE: the suite imports several modules that are NOT yet committed
REM  (workflow.store.ts, toast.store.ts, persistence.service.ts,
REM   export.service.ts, types/Workflow.ts, types/PartGroup.ts).
REM  Tests won't run on a fresh clone until those are committed too.
REM  To include them, uncomment the next block:
REM
REM  git add src/store/workflow.store.ts src/store/toast.store.ts ^
REM          src/services/persistence.service.ts src/services/export.service.ts ^
REM          src/types/Workflow.ts src/types/PartGroup.ts
REM
REM  ...or to commit EVERYTHING currently pending, replace the git add above with:
REM      git add -A
REM ---------------------------------------------------------------------------

REM 3) Commit.
git commit -m "test: add Vitest suite (103 tests) for stores, services, utils & ModelParser + docs"

REM 4) Push to main.
git push origin main

echo.
echo Done. Review the output above for any errors.
pause
