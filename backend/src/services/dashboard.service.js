const pool = require("../config/database");

class DashboardService {
  /**
   * Calculate exact age based on DOB and a reference date (defaults to Today)
   */
  static calculateExactAge(dobInput, refDate = new Date()) {
    if (!dobInput) return null;
    const dob = new Date(dobInput);
    if (isNaN(dob.getTime())) return null;

    let age = refDate.getFullYear() - dob.getFullYear();
    const monthDiff = refDate.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Helper to format Date to YYYY-MM-DD string
   */
  static formatDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Helper to format relative label for 0, 1, or 2 days until birthday
   */
  static getRelativeLabel(daysUntil, targetDateObj) {
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    const monthShort = targetDateObj.toLocaleString("en-US", { month: "short" });
    const day = targetDateObj.getDate();
    return `${monthShort} ${day}`;
  }

  /**
   * Get clients with upcoming birthdays within the next 2 calendar days (0 = Today, 1 = Tomorrow, 2 = Day After Tomorrow).
   * Supports optional referenceDate for testing (e.g. year-end transition testing).
   */
  static async getUpcomingBirthdays(referenceDate = null) {
    const today = referenceDate ? new Date(referenceDate) : new Date();

    const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);

    const targetDays = [
      { date: d0, daysUntil: 0, month: d0.getMonth() + 1, day: d0.getDate() },
      { date: d1, daysUntil: 1, month: d1.getMonth() + 1, day: d1.getDate() },
      { date: d2, daysUntil: 2, month: d2.getMonth() + 1, day: d2.getDate() },
    ];

    const query = `
      SELECT c.id, c.name, c.dob, c.mobile_no, c.email, c.status
      FROM clients c
      WHERE c.status = 'active'
        AND c.dob IS NOT NULL
        AND (
          (EXTRACT(MONTH FROM c.dob) = $1 AND EXTRACT(DAY FROM c.dob) = $2)
          OR (EXTRACT(MONTH FROM c.dob) = $3 AND EXTRACT(DAY FROM c.dob) = $4)
          OR (EXTRACT(MONTH FROM c.dob) = $5 AND EXTRACT(DAY FROM c.dob) = $6)
        )
    `;

    const params = [
      targetDays[0].month, targetDays[0].day,
      targetDays[1].month, targetDays[1].day,
      targetDays[2].month, targetDays[2].day,
    ];

    const result = await pool.query(query, params);

    const upcomingBirthdays = result.rows.map((row) => {
      const dobDate = new Date(row.dob);
      const dobMonth = dobDate.getMonth() + 1;
      const dobDay = dobDate.getDate();

      const matchedTarget = targetDays.find(
        (td) => td.month === dobMonth && td.day === dobDay
      );

      const daysUntil = matchedTarget ? matchedTarget.daysUntil : 0;
      const targetDate = matchedTarget ? matchedTarget.date : d0;

      const age = this.calculateExactAge(row.dob, d0);
      const birthdayDateStr = this.formatDateStr(targetDate);
      const relativeLabel = this.getRelativeLabel(daysUntil, targetDate);

      return {
        id: row.id,
        client_id: row.id,
        name: row.name,
        dob: this.formatDateStr(dobDate),
        age,
        birthday_date: birthdayDateStr,
        days_until_birthday: daysUntil,
        relative_label: relativeLabel,
      };
    });

    // Sort by days_until_birthday ASC (0 -> 1 -> 2), then by name ASC
    upcomingBirthdays.sort((a, b) => {
      if (a.days_until_birthday !== b.days_until_birthday) {
        return a.days_until_birthday - b.days_until_birthday;
      }
      return a.name.localeCompare(b.name);
    });

    return upcomingBirthdays;
  }

  /**
   * Get client overview statistics (Active count, Non-Active count, Demat count, Mutual Fund count)
   */
  static async getClientOverviewStats() {
    // 1. Active Clients Count
    const activeRes = await pool.query(
      `SELECT COUNT(*) AS count FROM clients WHERE status = 'active'`
    );
    const active_clients_count = parseInt(activeRes.rows[0].count, 10) || 0;

    // 2. Non-Active Clients Count
    const nonActiveRes = await pool.query(
      `SELECT COUNT(*) AS count FROM clients WHERE status != 'active'`
    );
    const non_active_clients_count = parseInt(nonActiveRes.rows[0].count, 10) || 0;

    // 3. Demat Clients Count (Unique clients subscribed to Demat)
    const dematRes = await pool.query(
      `SELECT COUNT(DISTINCT c.id) AS count
       FROM clients c
       LEFT JOIN client_service_assignments csa ON csa.client_id = c.id
       LEFT JOIN client_services cs ON cs.id = csa.service_id
       WHERE LOWER(cs.name) LIKE '%demat%' OR (c.services IS NOT NULL AND c.services::text ILIKE '%demat%')`
    );
    const demat_clients_count = parseInt(dematRes.rows[0].count, 10) || 0;

    // 4. Mutual Fund Clients Count (Unique clients subscribed to Mutual Fund)
    const mfRes = await pool.query(
      `SELECT COUNT(DISTINCT c.id) AS count
       FROM clients c
       LEFT JOIN client_service_assignments csa ON csa.client_id = c.id
       LEFT JOIN client_services cs ON cs.id = csa.service_id
       WHERE LOWER(cs.name) LIKE '%mutual fund%' OR (c.services IS NOT NULL AND c.services::text ILIKE '%mutual fund%')`
    );
    const mutual_fund_clients_count = parseInt(mfRes.rows[0].count, 10) || 0;

    return {
      active_clients_count,
      non_active_clients_count,
      demat_clients_count,
      mutual_fund_clients_count,
    };
  }

  /**
   * Get cross-selling statistics:
   * 1. equityWithoutMutualFund: Clients having Equity/Trading/Demat but no Mutual Fund
   * 2. mutualFundWithoutEquity: Clients having Mutual Fund but no Equity/Trading/Demat
   */
  static async getCrossSellingStats() {
    // 1. Equity -> Mutual Fund Count
    const opp1Res = await pool.query(`
      SELECT COUNT(DISTINCT c.id) AS count
      FROM clients c
      WHERE c.status = 'active' AND c.client_status = 'CLIENT'
        AND (
          EXISTS (
            SELECT 1 FROM client_service_assignments csa
            JOIN client_services cs ON cs.id = csa.service_id
            WHERE csa.client_id = c.id
              AND (LOWER(cs.name) LIKE '%equity%' OR LOWER(cs.name) LIKE '%trading%' OR LOWER(cs.name) LIKE '%demat%')
          )
          OR (c.services IS NOT NULL AND (c.services::text ILIKE '%equity%' OR c.services::text ILIKE '%trading%' OR c.services::text ILIKE '%demat%'))
        )
        AND NOT (
          EXISTS (
            SELECT 1 FROM client_service_assignments csa
            JOIN client_services cs ON cs.id = csa.service_id
            WHERE csa.client_id = c.id
              AND (LOWER(cs.name) LIKE '%mutual fund%' OR LOWER(cs.name) LIKE '%mf%')
          )
          OR (c.services IS NOT NULL AND (c.services::text ILIKE '%mutual fund%' OR c.services::text ILIKE '%mf%'))
        )
    `);

    // 2. Mutual Fund -> Equity Count
    const opp2Res = await pool.query(`
      SELECT COUNT(DISTINCT c.id) AS count
      FROM clients c
      WHERE c.status = 'active' AND c.client_status = 'CLIENT'
        AND (
          EXISTS (
            SELECT 1 FROM client_service_assignments csa
            JOIN client_services cs ON cs.id = csa.service_id
            WHERE csa.client_id = c.id
              AND (LOWER(cs.name) LIKE '%mutual fund%' OR LOWER(cs.name) LIKE '%mf%')
          )
          OR (c.services IS NOT NULL AND (c.services::text ILIKE '%mutual fund%' OR c.services::text ILIKE '%mf%'))
        )
        AND NOT (
          EXISTS (
            SELECT 1 FROM client_service_assignments csa
            JOIN client_services cs ON cs.id = csa.service_id
            WHERE csa.client_id = c.id
              AND (LOWER(cs.name) LIKE '%equity%' OR LOWER(cs.name) LIKE '%trading%' OR LOWER(cs.name) LIKE '%demat%')
          )
          OR (c.services IS NOT NULL AND (c.services::text ILIKE '%equity%' OR c.services::text ILIKE '%trading%' OR c.services::text ILIKE '%demat%'))
        )
    `);

    // 3. No Term Insurance Count
    const opp3Res = await pool.query(`
      SELECT COUNT(DISTINCT c.id) AS count
      FROM clients c
      WHERE c.status = 'active' AND c.client_status = 'CLIENT'
        AND NOT (
          EXISTS (
            SELECT 1 FROM client_service_assignments csa
            JOIN client_services cs ON cs.id = csa.service_id
            WHERE csa.client_id = c.id
              AND (LOWER(cs.name) LIKE '%insurance%' OR LOWER(cs.name) LIKE '%term%')
          )
          OR (c.services IS NOT NULL AND (c.services::text ILIKE '%insurance%' OR c.services::text ILIKE '%term%'))
        )
    `);

    return {
      equityWithoutMutualFund: {
        count: parseInt(opp1Res.rows[0].count, 10) || 0,
      },
      mutualFundWithoutEquity: {
        count: parseInt(opp2Res.rows[0].count, 10) || 0,
      },
      noTermInsurance: {
        count: parseInt(opp3Res.rows[0].count, 10) || 0,
      },
    };
  }


  /**
   * Get pending client follow-ups with real PostgreSQL data.
   * Scoped by client relationship (related_client_id IS NOT NULL, related_lead_id IS NULL)
   * and non-final status (status NOT IN ('COMPLETED', 'CANCELLED')).
   */
  static async getPendingFollowups(userContext = {}) {
    const { userId, roleName } = userContext;
    const isAdmin = roleName === "Admin" || roleName === "admin";

    let whereConditions = [
      `t.related_client_id IS NOT NULL`,
      `t.related_lead_id IS NULL`,
      `t.status NOT IN ('COMPLETED', 'CANCELLED')`
    ];
    let params = [];

    if (!isAdmin && userId) {
      params.push(parseInt(userId, 10));
      whereConditions.push(`(t.assigned_to = $${params.length} OR t.created_by = $${params.length})`);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const query = `
      SELECT
        t.id, t.title, t.description, t.task_type, t.priority, t.status,
        t.due_date, t.due_time, t.completed_at, t.created_at, t.updated_at,
        t.related_client_id, t.assigned_to,
        c.id AS client_id, c.name AS client_name, c.ucc_no AS client_ucc,
        au.id AS assigned_to_id, au.name AS assigned_to_name, au.email AS assigned_to_email
      FROM tasks t
      INNER JOIN clients c ON c.id = t.related_client_id
      INNER JOIN users au ON au.id = t.assigned_to
      ${whereClause}
      ORDER BY
        CASE
          WHEN t.due_date < CURRENT_DATE THEN 1
          WHEN t.due_date = CURRENT_DATE THEN 2
          ELSE 3
        END ASC,
        CASE UPPER(t.priority)
          WHEN 'HIGH' THEN 1
          WHEN 'MEDIUM' THEN 2
          WHEN 'LOW' THEN 3
          ELSE 4
        END ASC,
        t.due_date ASC,
        t.due_time ASC NULLS LAST,
        t.id DESC
      LIMIT 50
    `;

    const result = await pool.query(query, params);

    const tasks = result.rows.map((row) => {
      let formattedDueDate = null;
      if (row.due_date) {
        if (row.due_date instanceof Date) {
          const yyyy = row.due_date.getFullYear();
          const mm = String(row.due_date.getMonth() + 1).padStart(2, "0");
          const dd = String(row.due_date.getDate()).padStart(2, "0");
          formattedDueDate = `${yyyy}-${mm}-${dd}`;
        } else {
          formattedDueDate = String(row.due_date).split("T")[0];
        }
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description || null,
        task_type: row.task_type,
        priority: row.priority,
        status: row.status,
        due_date: formattedDueDate,
        due_time: row.due_time || null,
        related_client_id: row.related_client_id,
        client: {
          id: row.client_id,
          name: row.client_name,
          full_name: row.client_name,
          ucc_no: row.client_ucc,
        },
        assigned_to: row.assigned_to,
        assigned_user: {
          id: row.assigned_to_id,
          name: row.assigned_to_name,
          full_name: row.assigned_to_name,
          email: row.assigned_to_email,
        },
      };
    });

    return {
      total: tasks.length,
      tasks,
    };
  }
}

module.exports = DashboardService;

