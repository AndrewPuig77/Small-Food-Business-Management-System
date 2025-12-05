const { getDb, saveDatabase } = require('../database/database');

// Helper to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// ==================== SALES ANALYTICS ====================

// Get sales analytics with trends and breakdowns
const getSalesAnalytics = (businessId, startDate, endDate, groupBy = 'day') => {
  const db = getDb();
  
  // Main sales query with all breakdowns
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  const query = `
    SELECT 
      DATE(t.created_at) as sale_date,
      strftime('%H', t.created_at) as hour_of_day,
      strftime('%w', t.created_at) as day_of_week,
      COUNT(DISTINCT t.id) as transaction_count,
      SUM(t.total) as revenue,
      SUM(t.total - t.tax) as revenue_before_tax,
      AVG(t.total) as avg_transaction_value,
      SUM(ti.quantity) as total_items_sold,
      mi.name as item_name,
      COALESCE(mc.name, 'Uncategorized') as category,
      SUM(ti.total_price) as category_revenue,
      SUM(ti.quantity) as category_items_sold
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN menu_items mi ON ti.menu_item_id = mi.id
    LEFT JOIN menu_categories mc ON mi.category_id = mc.id
    WHERE t.business_id = ${businessId}
      AND t.status = 'completed'
      AND t.created_at >= ${escape(startDateTime)} AND t.created_at <= ${escape(endDateTime)}
    GROUP BY DATE(t.created_at), strftime('%H', t.created_at), 
             strftime('%w', t.created_at), mi.name, mc.name
    ORDER BY sale_date DESC, hour_of_day
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// Get sales trends for comparison (YoY, MoM, WoW)
const getSalesTrends = (businessId, currentStart, currentEnd, previousStart, previousEnd) => {
  const db = getDb();
  
  const currentStartDateTime = `${currentStart} 00:00:00`;
  const currentEndDateTime = `${currentEnd} 23:59:59`;
  const previousStartDateTime = `${previousStart} 00:00:00`;
  const previousEndDateTime = `${previousEnd} 23:59:59`;
  
  const query = `
    SELECT 
      'current' as period,
      COUNT(DISTINCT id) as transaction_count,
      SUM(total) as revenue,
      AVG(total) as avg_transaction
    FROM transactions
    WHERE business_id = ${businessId}
      AND status = 'completed'
      AND created_at >= ${escape(currentStartDateTime)} AND created_at <= ${escape(currentEndDateTime)}
    
    UNION ALL
    
    SELECT 
      'previous' as period,
      COUNT(DISTINCT id) as transaction_count,
      SUM(total) as revenue,
      AVG(total) as avg_transaction
    FROM transactions
    WHERE business_id = ${businessId}
      AND status = 'completed'
      AND created_at >= ${escape(previousStartDateTime)} AND created_at <= ${escape(previousEndDateTime)}
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// ==================== TOP/BOTTOM PERFORMERS ====================

const getTopBottomPerformers = (businessId, startDate, endDate, limit = 10) => {
  const db = getDb();
  
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  const query = `
    SELECT 
      mi.name as item_name,
      SUM(ti.quantity) as quantity_sold,
      SUM(ti.total_price) as revenue,
      SUM(ti.quantity * COALESCE(mi.cost, ti.unit_price * 0.3)) as estimated_cost,
      (SUM(ti.total_price) - SUM(ti.quantity * COALESCE(mi.cost, ti.unit_price * 0.3))) as estimated_profit,
      CASE 
        WHEN SUM(ti.total_price) > 0 
        THEN ((SUM(ti.total_price) - SUM(ti.quantity * COALESCE(mi.cost, ti.unit_price * 0.3))) / SUM(ti.total_price)) * 100
        ELSE 0 
      END as profit_margin
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    JOIN menu_items mi ON ti.menu_item_id = mi.id
    WHERE t.business_id = ${businessId}
      AND t.status = 'completed'
      AND t.created_at >= ${escape(startDateTime)} AND t.created_at <= ${escape(endDateTime)}
    GROUP BY mi.name
    ORDER BY revenue DESC
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// ==================== INVENTORY ANALYTICS ====================

const getInventoryAnalytics = (businessId) => {
  const db = getDb();
  
  // Calculate 30 days ago datetime string
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10) + ' 00:00:00';
  
  const query = `
    SELECT 
      i.name as item_name,
      i.quantity,
      i.unit_cost,
      (i.quantity * COALESCE(i.unit_cost, 0)) as total_value,
      CASE 
        WHEN i.quantity > 0 THEN 
          CAST(COALESCE(
            (SELECT SUM(ti.quantity) 
             FROM transaction_items ti 
             JOIN transactions t ON ti.transaction_id = t.id
             JOIN menu_items mi ON ti.menu_item_id = mi.id
             WHERE mi.name = i.name 
               AND t.business_id = ${businessId}
               AND t.created_at >= ${escape(thirtyDaysAgoStr)}),
            0
          ) AS FLOAT) / i.quantity
        ELSE 0 
      END as turnover_rate,
      COALESCE(
        (SELECT SUM(ti.quantity) 
         FROM transaction_items ti 
         JOIN transactions t ON ti.transaction_id = t.id
         JOIN menu_items mi ON ti.menu_item_id = mi.id
         WHERE mi.name = i.name 
           AND t.business_id = ${businessId}
           AND t.created_at >= ${escape(thirtyDaysAgoStr)}),
        0
      ) as sold_last_30_days,
      CASE 
        WHEN i.quantity <= COALESCE(i.min_quantity, 0) THEN 'low'
        WHEN i.quantity <= COALESCE(i.min_quantity, 0) * 2 THEN 'medium'
        ELSE 'good'
      END as stock_status
    FROM inventory_items i
    WHERE i.business_id = ${businessId}
    ORDER BY total_value DESC
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// Get waste tracking
const getWasteAnalytics = (businessId, startDate, endDate) => {
  const db = getDb();
  
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  const query = `
    SELECT 
      DATE(created_at) as waste_date,
      item_name,
      quantity,
      reason,
      cost_per_unit,
      (quantity * cost_per_unit) as total_waste_value
    FROM inventory_waste
    WHERE business_id = ${businessId}
      AND created_at >= ${escape(startDateTime)} AND created_at <= ${escape(endDateTime)}
    ORDER BY waste_date DESC, total_waste_value DESC
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// ==================== COST ANALYSIS ====================

const getCostAnalysis = (businessId, startDate, endDate) => {
  const db = getDb();
  
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  // Food cost percentage
  const foodCostQuery = `
    SELECT 
      DATE(t.created_at) as date,
      SUM(t.total) as revenue,
      SUM(ti.quantity * COALESCE(mi.cost, ti.unit_price * 0.3)) as food_cost,
      CASE 
        WHEN SUM(t.total) > 0 
        THEN (SUM(ti.quantity * COALESCE(mi.cost, ti.unit_price * 0.3)) / SUM(t.total)) * 100
        ELSE 0 
      END as food_cost_percentage
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN menu_items mi ON ti.menu_item_id = mi.id
    WHERE t.business_id = ${businessId}
      AND t.status = 'completed'
      AND t.created_at >= ${escape(startDateTime)} AND t.created_at <= ${escape(endDateTime)}
    GROUP BY DATE(t.created_at)
    ORDER BY date
  `;
  
  // Labor cost percentage
  const laborCostQuery = `
    SELECT 
      DATE(tl.clock_in) as date,
      SUM(tl.hours_worked * e.hourly_rate) as labor_cost,
      (SELECT SUM(total) FROM transactions 
       WHERE business_id = ${businessId} 
         AND status = 'completed' 
         AND created_at >= DATE(tl.clock_in) || ' 00:00:00'
         AND created_at <= DATE(tl.clock_in) || ' 23:59:59') as revenue,
      CASE 
        WHEN (SELECT SUM(total) FROM transactions 
              WHERE business_id = ${businessId} 
                AND status = 'completed' 
                AND created_at >= DATE(tl.clock_in) || ' 00:00:00'
                AND created_at <= DATE(tl.clock_in) || ' 23:59:59') > 0
        THEN (SUM(tl.hours_worked * e.hourly_rate) / 
              (SELECT SUM(total) FROM transactions 
               WHERE business_id = ${businessId} 
                 AND status = 'completed' 
                 AND created_at >= DATE(tl.clock_in) || ' 00:00:00'
                 AND created_at <= DATE(tl.clock_in) || ' 23:59:59')) * 100
        ELSE 0 
      END as labor_cost_percentage
    FROM time_logs tl
    JOIN employees e ON tl.employee_id = e.id
    WHERE e.business_id = ${businessId}
      AND tl.clock_out IS NOT NULL
      AND tl.clock_in >= ${escape(startDateTime)} AND tl.clock_in <= ${escape(endDateTime)}
    GROUP BY DATE(tl.clock_in)
    ORDER BY date
  `;
  
  const foodResult = db.exec(foodCostQuery);
  const laborResult = db.exec(laborCostQuery);
  
  return {
    foodCost: foodResult.length > 0 ? foodResult[0] : { columns: [], values: [] },
    laborCost: laborResult.length > 0 ? laborResult[0] : { columns: [], values: [] }
  };
};

// ==================== EMPLOYEE PERFORMANCE ====================

const getEmployeePerformance = (businessId, startDate, endDate) => {
  const db = getDb();
  
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  const query = `
    SELECT 
      e.id,
      e.first_name || ' ' || e.last_name as employee_name,
      e.role,
      e.hourly_rate,
      COUNT(DISTINCT tl.id) as shifts_worked,
      SUM(tl.hours_worked) as total_hours,
      SUM(CASE WHEN tl.hours_worked > 8 THEN tl.hours_worked - 8 ELSE 0 END) as overtime_hours,
      SUM(tl.hours_worked * e.hourly_rate) as labor_cost,
      -- Calculate sales per labor hour (need to join transactions by cashier)
      COALESCE(
        (SELECT SUM(t.total) 
         FROM transactions t 
         WHERE t.cashier_id = e.id 
           AND t.business_id = ${businessId}
           AND t.created_at >= ${escape(startDateTime)} AND t.created_at <= ${escape(endDateTime)}),
        0
      ) as total_sales,
      CASE 
        WHEN SUM(tl.hours_worked) > 0 THEN
          COALESCE(
            (SELECT SUM(t.total) 
             FROM transactions t 
             WHERE t.cashier_id = e.id 
               AND t.business_id = ${businessId}
               AND t.created_at >= ${escape(startDateTime)} AND t.created_at <= ${escape(endDateTime)}),
            0
          ) / SUM(tl.hours_worked)
        ELSE 0 
      END as sales_per_labor_hour
    FROM employees e
    LEFT JOIN time_logs tl ON e.id = tl.employee_id 
      AND tl.clock_out IS NOT NULL
      AND tl.clock_in >= ${escape(startDateTime)} AND tl.clock_in <= ${escape(endDateTime)}
    WHERE e.business_id = ${businessId}
    GROUP BY e.id, e.first_name, e.last_name, e.role, e.hourly_rate
    ORDER BY total_hours DESC
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// ==================== PEAK HOURS ANALYSIS ====================

const getPeakHoursAnalysis = (businessId, startDate, endDate) => {
  const db = getDb();
  
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  const query = `
    SELECT 
      strftime('%w', created_at) as day_of_week,
      strftime('%H', created_at) as hour_of_day,
      COUNT(id) as transaction_count,
      SUM(total) as revenue,
      AVG(total) as avg_transaction_value
    FROM transactions
    WHERE business_id = ${businessId}
      AND status = 'completed'
      AND created_at >= ${escape(startDateTime)} AND created_at <= ${escape(endDateTime)}
    GROUP BY strftime('%w', created_at), strftime('%H', created_at)
    ORDER BY day_of_week, hour_of_day
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// ==================== CUSTOMER INSIGHTS ====================

const getCustomerInsights = (businessId, startDate, endDate) => {
  const db = getDb();
  
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  const query = `
    SELECT 
      COUNT(DISTINCT id) as total_transactions,
      AVG(total) as avg_transaction_value,
      SUM(total) as total_revenue,
      MIN(total) as min_transaction,
      MAX(total) as max_transaction,
      -- Item combinations (most common pairs)
      (SELECT mi.name || ', ' || 
              (SELECT mi2.name 
               FROM transaction_items ti2 
               JOIN menu_items mi2 ON ti2.menu_item_id = mi2.id
               WHERE ti2.transaction_id = ti.transaction_id 
                 AND ti2.menu_item_id != ti.menu_item_id 
               LIMIT 1) as combo
       FROM transaction_items ti
       JOIN transactions t ON ti.transaction_id = t.id
       JOIN menu_items mi ON ti.menu_item_id = mi.id
       WHERE t.business_id = ${businessId}
         AND t.created_at >= ${escape(startDateTime)} AND t.created_at <= ${escape(endDateTime)}
       GROUP BY combo
       ORDER BY COUNT(*) DESC
       LIMIT 10) as popular_combos
    FROM transactions
    WHERE business_id = ${businessId}
      AND status = 'completed'
      AND created_at >= ${escape(startDateTime)} AND created_at <= ${escape(endDateTime)}
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// ==================== FINANCIAL SUMMARIES ====================

const getFinancialSummary = (businessId, startDate, endDate) => {
  const db = getDb();
  
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  // Revenue
  const revenueQuery = `
    SELECT 
      SUM(total) as total_revenue,
      SUM(tax) as total_tax,
      SUM(total - tax) as revenue_before_tax,
      COUNT(id) as transaction_count
    FROM transactions
    WHERE business_id = ${businessId}
      AND status = 'completed'
      AND created_at >= ${escape(startDateTime)} AND created_at <= ${escape(endDateTime)}
  `;
  
  // Expenses (labor + inventory purchases)
  const expensesQuery = `
    SELECT 
      COALESCE(SUM(tl.hours_worked * e.hourly_rate), 0) as labor_cost,
      COALESCE((SELECT SUM(quantity * unit_cost) FROM inventory_transactions 
                WHERE business_id = ${businessId} 
                  AND transaction_type = 'purchase'
                  AND created_at >= ${escape(startDateTime)} AND created_at <= ${escape(endDateTime)}), 0) as inventory_purchases
    FROM time_logs tl
    JOIN employees e ON tl.employee_id = e.id
    WHERE e.business_id = ${businessId}
      AND tl.clock_out IS NOT NULL
      AND tl.clock_in >= ${escape(startDateTime)} AND tl.clock_in <= ${escape(endDateTime)}
  `;
  
  const revenueResult = db.exec(revenueQuery);
  const expensesResult = db.exec(expensesQuery);
  
  return {
    revenue: revenueResult.length > 0 ? revenueResult[0] : { columns: [], values: [] },
    expenses: expensesResult.length > 0 ? expensesResult[0] : { columns: [], values: [] }
  };
};

// ==================== FORECASTING ====================

const getForecastData = (businessId) => {
  const db = getDb();
  
  // Calculate 90 days ago datetime string
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10) + ' 00:00:00';
  
  // Get historical data for last 90 days
  const query = `
    SELECT 
      DATE(created_at) as date,
      strftime('%w', created_at) as day_of_week,
      COUNT(id) as transaction_count,
      SUM(total) as revenue,
      AVG(total) as avg_transaction
    FROM transactions
    WHERE business_id = ${businessId}
      AND status = 'completed'
      AND created_at >= ${escape(ninetyDaysAgoStr)}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;
  
  const result = db.exec(query);
  return result.length > 0 ? result[0] : { columns: [], values: [] };
};

// Simple moving average forecast
const calculateForecast = (historicalData, periods = 7) => {
  if (!historicalData || historicalData.values.length < periods) {
    return [];
  }
  
  const revenues = historicalData.values.map(row => row[4]); // revenue column
  const forecast = [];
  
  // Calculate moving average
  for (let i = 0; i < periods; i++) {
    const last7 = revenues.slice(Math.max(0, revenues.length - 7));
    const avg = last7.reduce((a, b) => a + b, 0) / last7.length;
    forecast.push(avg);
  }
  
  return forecast;
};

module.exports = {
  getSalesAnalytics,
  getSalesTrends,
  getTopBottomPerformers,
  getInventoryAnalytics,
  getWasteAnalytics,
  getCostAnalysis,
  getEmployeePerformance,
  getPeakHoursAnalysis,
  getCustomerInsights,
  getFinancialSummary,
  getForecastData,
  calculateForecast
};
