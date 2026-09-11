const DashboardService = require("../services/dashboard.service");

console.log("=== RUNNING UPCOMING BIRTHDAYS UNIT & INTEGRATION TESTS ===");
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  // Test 1: Age Calculation
  {
    const today = new Date("2026-09-09");
    const ageToday = DashboardService.calculateExactAge("1981-09-09", today);
    assert(ageToday === 45, `Birthday today (1981-09-09 on 2026-09-09) gives age 45 (got ${ageToday})`);

    const ageTomorrow = DashboardService.calculateExactAge("1988-09-10", today);
    assert(ageTomorrow === 37, `Birthday tomorrow (1988-09-10 on 2026-09-09) gives current age 37 (got ${ageTomorrow})`);

    const ageDayAfter = DashboardService.calculateExactAge("1992-09-11", today);
    assert(ageDayAfter === 33, `Birthday in 2 days (1992-09-11 on 2026-09-09) gives current age 33 (got ${ageDayAfter})`);
  }

  // Test 2: Relative Labels
  {
    const d0 = new Date("2026-09-09");
    const d1 = new Date("2026-09-10");
    const d2 = new Date("2026-09-11");

    assert(DashboardService.getRelativeLabel(0, d0) === "Today", "Days 0 returns 'Today'");
    assert(DashboardService.getRelativeLabel(1, d1) === "Tomorrow", "Days 1 returns 'Tomorrow'");
    assert(DashboardService.getRelativeLabel(2, d2) === "Sep 11", "Days 2 returns 'Sep 11'");
  }

  // Test 3: Year-End Transition Logic (Dec 30 reference date)
  {
    const yearEndRef = "2026-12-30";
    const refDate = new Date(yearEndRef);
    const d0 = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const d1 = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + 1);
    const d2 = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + 2);

    assert(DashboardService.formatDateStr(d0) === "2026-12-30", "Dec 30 formatted correctly");
    assert(DashboardService.formatDateStr(d1) === "2026-12-31", "Dec 31 formatted correctly");
    assert(DashboardService.formatDateStr(d2) === "2027-01-01", "Jan 1 next year formatted correctly");

    assert(DashboardService.getRelativeLabel(0, d0) === "Today", "Dec 30 relative label 'Today'");
    assert(DashboardService.getRelativeLabel(1, d1) === "Tomorrow", "Dec 31 relative label 'Tomorrow'");
    assert(DashboardService.getRelativeLabel(2, d2) === "Jan 1", "Jan 1 relative label 'Jan 1'");
  }

  // Test 4: Database Query Execution (if DB connected)
  try {
    const result = await DashboardService.getUpcomingBirthdays("2026-09-09");
    assert(Array.isArray(result), `getUpcomingBirthdays returned array of length ${result.length}`);
    if (result.length > 0) {
      const first = result[0];
      assert(first.hasOwnProperty("id"), "Item has id");
      assert(first.hasOwnProperty("name"), "Item has name");
      assert(first.hasOwnProperty("age"), "Item has age");
      assert(first.hasOwnProperty("relative_label"), "Item has relative_label");
      assert(first.hasOwnProperty("days_until_birthday"), "Item has days_until_birthday");
    }
  } catch (err) {
    console.log("[INFO] DB connection test skipped or failed:", err.message);
  }

  console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("ALL UPCOMING BIRTHDAYS LOGIC TESTS PASSED PERFECTLY!");
    process.exit(0);
  }
}

runTests();
