# Phase 1 Manual Test Plan

**Date**: 2025-12-27
**Test Engineer**: zeplar_test-engineer
**Request**: req_37Sstth6fsea5PtOGv5LGdo8CmR
**Target**: Phase 1 End-to-End Verification

## Prerequisites

### Setup

1. **Start Development Server**:
   ```bash
   cd ~/code/domains/me/zeplar
   npm run dev
   ```
   - App should start on `http://localhost:5174` (or 5173)

2. **Install Redux DevTools**:
   - Chrome: https://chrome.google.com/webstore/detail/redux-devtools
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/

3. **Clear Previous State** (Optional - for clean test):
   - Open browser DevTools → Application → IndexedDB
   - Delete `zeplar` database
   - Refresh page

---

## Test Scenario 1: Card Generation Verification

**Objective**: Verify 30 L1 flashcards are generated and loaded into Redux store.

### Steps

1. Open `http://localhost:5174` in browser
2. Open Redux DevTools (F12 → Redux tab)
3. Navigate to State → `patterns` → `cards`

### Expected Results

✅ **PASS Criteria**:
- [ ] `cards` object contains 30 entries
- [ ] Each card has required fields:
  - `id` (format: `pattern-l1-type`, e.g., `circuit-breaker-l1-definition`)
  - `patternId` (e.g., `circuit-breaker`)
  - `layer: 1`
  - `questionType` (one of: definition, problem-identification, pattern-recognition, tradeoff-pros, tradeoff-cons)
  - `front: { text }`
  - `back: { text }`
  - `grammarCoordinates: { ... }`

### Spot Check

Pick a random card (e.g., `retry-l1-definition`) and verify:
- [ ] `front.text` contains a question
- [ ] `back.text` contains an answer
- [ ] `patternId` matches the pattern name

### Screenshot

📸 **Take screenshot**: Redux DevTools showing `patterns.cards` with 30 entries

---

## Test Scenario 2: Study Session Flow

**Objective**: Complete a full study session with 3 card reviews at different quality ratings.

### Steps

1. Navigate to Dashboard (`http://localhost:5174/dashboard`)
2. Verify "Cards Due Today" shows a number > 0
3. Click **"Start Study Session"** button
4. Should navigate to `/study`

**Card 1** - Quality 3 (Acceptable):
5. Read the card front
6. Press `Space` to flip card
7. Verify card flips and shows back content
8. Press `3` key (or click quality 3 button if present)
9. Verify card advances to next card

**Card 2** - Quality 4 (Good):
10. Press `Space` to flip
11. Press `4` key

**Card 3** - Quality 5 (Perfect):
12. Press `Space` to flip
13. Press `5` key
14. Verify session completes
15. Should auto-navigate to `/study/summary`

### Expected Results

✅ **PASS Criteria**:
- [ ] Click "Start Session" → navigates to `/study`
- [ ] Card flip animation works smoothly (visual inspection)
- [ ] Space bar flips card
- [ ] Number keys (3, 4, 5) rate card and advance
- [ ] Progress bar updates (e.g., "Card 2 of 30")
- [ ] After 3 reviews → auto-navigate to `/study/summary`

### Redux DevTools Verification

Open Redux DevTools → Action tab:
- [ ] See `learning/startSession` action
- [ ] See `learning/submitReview` actions (3 times)
- [ ] See `learning/nextCard` actions (2 times)
- [ ] See `learning/endSession` action

### Screenshot

📸 **Take screenshot**: Study page with card displayed and flipped

---

## Test Scenario 3: Session Summary Verification

**Objective**: Verify session summary displays correct stats.

### Steps

1. You should already be on `/study/summary` from Scenario 2
2. Verify the following data is displayed:

### Expected Results

✅ **PASS Criteria**:
- [ ] **Cards Reviewed**: Shows `3`
- [ ] **Correct Answers**: Shows `2` or `3` (quality >= 3)
- [ ] **Accuracy**: Shows percentage (66% or 100%)
- [ ] **Session Duration**: Shows time in minutes
- [ ] **Due Tomorrow**: Shows a number
- [ ] Streak indicator shows (if first session: `1 day`)

### Action Buttons

3. Click **"Continue Studying"**
   - [ ] Should navigate to `/study`
   - [ ] New session starts with fresh cards

4. Click **"Back to Dashboard"** (or press Esc from study page)
   - [ ] Should navigate to `/dashboard`

### Screenshot

📸 **Take screenshot**: Session summary showing all stats

---

## Test Scenario 4: Dashboard Verification

**Objective**: Verify dashboard displays updated stats after session.

### Steps

1. Navigate to `/dashboard` (should already be there from Scenario 3)
2. Verify the following elements:

### Expected Results

✅ **PASS Criteria**:
- [ ] **Cards Due Today**: Number should be less than before (3 cards reviewed)
- [ ] **Current Streak**: Shows `🔥 1 days` (first session of the day)
- [ ] **Total Reviews**: Shows `3`
- [ ] **Last Study**: Shows today's date (YYYY-MM-DD format)
- [ ] **Activity Heatmap**: Last square (today) shows `3` with blue background
- [ ] **Pattern Mastery**: Patterns you reviewed show > 0% mastery

### Redux DevTools Verification

Open Redux DevTools → State → `learning`:
- [ ] `stats.totalReviews === 3`
- [ ] `stats.streak === 1`
- [ ] `stats.lastStudyDate === "2025-12-27"` (today)

### Screenshot

📸 **Take screenshot**: Dashboard showing updated stats

---

## Test Scenario 5: SM-2 Scheduling Test

**Objective**: Verify cards scheduled correctly based on quality rating.

### Steps

1. From dashboard, start a new study session
2. Review ONE card with quality 5 (perfect)
3. Note the `cardId` (e.g., `circuit-breaker-l1-definition`)
4. Complete session
5. Open Redux DevTools → State → `learning` → `progress`
6. Find the card you just reviewed

### Expected Results

✅ **PASS Criteria**:
- [ ] Card entry exists in `progress` object
- [ ] `easeFactor` >= 2.5 (SM-2 default or higher)
- [ ] `interval` > 0 (days until next review)
- [ ] `repetitions` >= 1
- [ ] `nextReviewDate` is a future date (ISO string)
- [ ] `lastReviewDate` is today

### Future Review Test

7. Start another study session
8. Verify the card you rated quality 5 does NOT appear in the queue
   - (It should be scheduled for future, not due today)

### Redux DevTools Example

```json
{
  "circuit-breaker-l1-definition": {
    "cardKey": "circuit-breaker-l1-definition",
    "easeFactor": 2.6,
    "interval": 1,
    "repetitions": 1,
    "lastReviewDate": "2025-12-27T...",
    "nextReviewDate": "2025-12-28T..."  // Tomorrow
  }
}
```

### Screenshot

📸 **Take screenshot**: Redux DevTools showing card progress with nextReviewDate

---

## Test Scenario 6: Persistence Test

**Objective**: Verify progress persists across browser sessions.

### Steps

1. Complete a session with 5 card reviews (any quality ratings)
2. Open Redux DevTools → State → `learning`
3. Note the following values:
   - `stats.totalReviews`
   - `stats.streak`
   - Number of entries in `progress` object

4. **Close the browser tab** completely

5. **Reopen the app** (`http://localhost:5174`)

6. Open Redux DevTools → State → `learning`

### Expected Results

✅ **PASS Criteria**:
- [ ] `stats.totalReviews` matches value from before closing
- [ ] `stats.streak` matches value from before closing
- [ ] `progress` object has same entries (same card keys)
- [ ] Dashboard shows same stats (totalReviews, streak)

### IndexedDB Verification

7. Open DevTools → Application → IndexedDB → `zeplar`
8. Verify stores exist:
   - [ ] `cardProgress` store has entries
   - [ ] `stats` store has entry

### Screenshot

📸 **Take screenshot**: Redux DevTools after reload showing persisted state

---

## Advanced Test: Multi-Day Streak Simulation

**Objective**: Verify streak increments correctly across days.

⚠️ **Note**: This requires manual state manipulation.

### Steps

1. Complete a session today
2. Verify `stats.streak === 1`
3. Verify `stats.lastStudyDate === "2025-12-27"` (today)

**Simulate Yesterday's Study**:

4. Open Redux DevTools → Dispatcher tab
5. Dispatch action manually:
   ```json
   {
     "type": "learning/loadStats",
     "payload": {
       "totalReviews": 3,
       "streak": 1,
       "lastStudyDate": "2025-12-26"  // Yesterday
     }
   }
   ```

6. Complete another study session
7. Open Redux DevTools → State → `learning` → `stats`

### Expected Results

✅ **PASS Criteria**:
- [ ] `stats.streak === 2` (incremented from 1)
- [ ] `stats.lastStudyDate === "2025-12-27"` (updated to today)

**Simulate Missed Day** (streak reset):

8. Dispatch action with lastStudyDate 3 days ago:
   ```json
   {
     "type": "learning/loadStats",
     "payload": {
       "totalReviews": 6,
       "streak": 2,
       "lastStudyDate": "2025-12-24"  // 3 days ago
     }
   }
   ```

9. Complete a session

### Expected Results

✅ **PASS Criteria**:
- [ ] `stats.streak === 1` (reset because >1 day gap)

### Screenshot

📸 **Take screenshot**: Redux DevTools showing streak increment logic

---

## Phase 1 Completion Checklist

From `docs/architecture/phase-1/core-learning-loop-design.md`:

- [ ] **L1 cards exist for 6 patterns** (Scenario 1)
- [ ] **Can start study session with queue of due cards** (Scenario 2)
- [ ] **SM-2 schedules reviews correctly** (Scenario 5)
- [ ] **Progress persists across sessions** (Scenario 6)
- [ ] **Dashboard shows: due count, streak, heatmap, mastery** (Scenario 4)
- [ ] **Session summary appears after completing queue** (Scenario 3)

---

## Bug Reporting Template

If you encounter bugs during testing, document them using this format:

### Bug Report

**Scenario**: (Which scenario number?)
**Step**: (Which step failed?)
**Expected**: (What should happen?)
**Actual**: (What actually happened?)
**Redux State**: (Copy relevant Redux state)
**Console Errors**: (Any errors in browser console?)
**Screenshot**: (Attach screenshot)

---

## Test Execution Checklist

### Before Testing
- [ ] Dev server running
- [ ] Redux DevTools installed
- [ ] Browser console open (F12)
- [ ] IndexedDB cleared (optional, for clean test)

### During Testing
- [ ] Document pass/fail for each scenario
- [ ] Take screenshots for each scenario
- [ ] Copy Redux state snippets for evidence
- [ ] Note any console errors or warnings

### After Testing
- [ ] Fill out Phase 1 Completion Checklist
- [ ] Create bug reports for any failures
- [ ] Share screenshots with test-engineer
- [ ] Update verification status

---

## Success Criteria Summary

✅ **Phase 1 PASSES if**:
- All 6 test scenarios pass
- All 6 Phase 1 completion criteria checked
- No critical bugs found
- App runs without console errors
- Redux state updates correctly throughout all flows

⚠️ **Phase 1 BLOCKED if**:
- Any scenario fails
- Critical bugs prevent normal usage
- Redux state corrupted or incorrect
- Persistence fails
- SM-2 scheduling incorrect

---

**Estimated Time**: 30-45 minutes

**Next Steps**:
1. Execute all 6 test scenarios
2. Document results
3. Report findings to test-engineer
4. If bugs found → create bugfix requests
5. If all pass → Phase 1 marked complete
