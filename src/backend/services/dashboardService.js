const db = require('../database/database');

// Helper function to execute query and return first row
const queryOne = (database, query, params = []) => {
  // Replace ? placeholders with actual values for sql.js
  let processedQuery = query;
  params.forEach(param => {
    processedQuery = processedQuery.replace('?', typeof param === 'string' ? `'${param}'` : param);
  });
  
  const result = database.exec(processedQuery);
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const row = {};
  columns.forEach((col, idx) => {
    row[col] = values[idx];
  });
  return row;
};

// Helper function to execute query and return all rows
const queryAll = (database, query, params = []) => {
  // Replace ? placeholders with actual values for sql.js
  let processedQuery = query;
  params.forEach(param => {
    processedQuery = processedQuery.replace('?', typeof param === 'string' ? `'${param}'` : param);
  });
  
  const result = database.exec(processedQuery);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
};

class DashboardService {
  /**
   * Get comprehensive dashboard overview data
   */
  async getDashboardOverview(businessId) {
    try {
      console.log('📊 Backend: getDashboardOverview called for businessId:', businessId);
      const database = db.getDb();
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      // Get yesterday for comparison
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.getFullYear() + '-' + 
        String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
        String(yesterday.getDate()).padStart(2, '0');
      
      // Get same day last week for comparison
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.getFullYear() + '-' + 
        String(lastWeek.getMonth() + 1).padStart(2, '0') + '-' + 
        String(lastWeek.getDate()).padStart(2, '0');
      
      console.log('📅 Querying sales for date:', todayStr);
      
      // Today's sales
      const todayStart = todayStr + ' 00:00:00';
      const todayEnd = todayStr + ' 23:59:59';
      const todaySales = queryOne(database, `
        SELECT 
          COALESCE(SUM(total), 0) as total_sales,
          COUNT(*) as order_count
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
          AND created_at <= ?
      `, [businessId, todayStart, todayEnd]);
      
      console.log('💰 Today\'s sales result:', todaySales);
      
      // Debug: Check what dates we have in transactions
      const recentDates = queryAll(database, `
        SELECT DISTINCT DATE(created_at) as date, COUNT(*) as count
        FROM transactions
        WHERE business_id = ? AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 5
      `, [businessId]);
      console.log('📊 Recent transaction dates:', recentDates);
      
      // Yesterday's sales
      const yesterdayStart = yesterdayStr + ' 00:00:00';
      const yesterdayEnd = yesterdayStr + ' 23:59:59';
      const yesterdaySales = queryOne(database, `
        SELECT COALESCE(SUM(total), 0) as total_sales
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
          AND created_at <= ?
      `, [businessId, yesterdayStart, yesterdayEnd]);
      
      // Last week same day sales
      const lastWeekStart = lastWeekStr + ' 00:00:00';
      const lastWeekEnd = lastWeekStr + ' 23:59:59';
      const lastWeekSales = queryOne(database, `
        SELECT COALESCE(SUM(total), 0) as total_sales
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
          AND created_at <= ?
      `, [businessId, lastWeekStart, lastWeekEnd]);
      
      // Active orders in progress
      const activeOrders = queryOne(database, `
        SELECT COUNT(*) as count
        FROM transactions
        WHERE business_id = ? 
          AND status IN ('pending', 'processing')
          AND created_at >= ?
          AND created_at <= ?
      `, [businessId, todayStart, todayEnd]);
      
      // Inventory alerts
      const inventoryAlerts = queryOne(database, `
        SELECT 
          COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as low_stock_count,
          COUNT(CASE WHEN expiry_date IS NOT NULL AND DATE(expiry_date) <= DATE('now', '+3 days') THEN 1 END) as expiring_count,
          COUNT(CASE WHEN expiry_date IS NOT NULL AND DATE(expiry_date) < DATE('now') THEN 1 END) as expired_count
        FROM inventory_items
        WHERE business_id = ?
      `, [businessId]);
      
      // Staff currently clocked in
      const clockedInStaff = queryAll(database, `
        SELECT 
          u.id,
          u.full_name,
          tl.clock_in,
          ROUND((JULIANDAY('now') - JULIANDAY(tl.clock_in)) * 24, 2) as hours_worked
        FROM time_logs tl
        JOIN employees e ON tl.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.business_id = ?
          AND tl.clock_out IS NULL
        ORDER BY tl.clock_in ASC
      `, [businessId]);
      
      // Today's labor cost
      const laborCost = queryOne(database, `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN tl.clock_out IS NOT NULL 
              THEN ((JULIANDAY(tl.clock_out) - JULIANDAY(tl.clock_in)) * 24) * e.hourly_rate
              ELSE ((JULIANDAY('now') - JULIANDAY(tl.clock_in)) * 24) * e.hourly_rate
            END
          ), 0) as total_labor_cost,
          COALESCE(SUM(
            CASE 
              WHEN tl.clock_out IS NOT NULL 
              THEN (JULIANDAY(tl.clock_out) - JULIANDAY(tl.clock_in)) * 24
              ELSE (JULIANDAY('now') - JULIANDAY(tl.clock_in)) * 24
            END
          ), 0) as total_hours
        FROM time_logs tl
        JOIN employees e ON tl.employee_id = e.id
        WHERE e.business_id = ?
          AND tl.clock_in >= ? AND tl.clock_in <= ?
      `, [businessId, todayStart, todayEnd]);
      
      // Cash on hand (last recorded till balance)
      const tillBalance = queryOne(database, `
        SELECT COALESCE(SUM(amount), 0) as cash_on_hand
        FROM expenses
        WHERE business_id = ? 
          AND category = 'Till Balance'
          AND expense_date = ?
      `, [businessId, todayStr]);
      
      // Average order fulfillment time (in minutes)
      // Note: updated_at may not exist in older databases, so we'll default to 0
      const avgFulfillmentTime = queryOne(database, `
        SELECT 
          AVG((JULIANDAY(COALESCE(updated_at, created_at)) - JULIANDAY(created_at)) * 24 * 60) as avg_minutes
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
          AND created_at <= ?
      `, [businessId, todayStart, todayEnd]);
      
      // Calculate comparison percentages
      const vsYesterday = yesterdaySales.total_sales > 0 
        ? ((todaySales.total_sales - yesterdaySales.total_sales) / yesterdaySales.total_sales) * 100 
        : 0;
      
      const vsLastWeek = lastWeekSales.total_sales > 0 
        ? ((todaySales.total_sales - lastWeekSales.total_sales) / lastWeekSales.total_sales) * 100 
        : 0;
      
      return {
        todaySales: todaySales.total_sales || 0,
        ordersCompleted: todaySales.order_count || 0,
        vsYesterday: Math.round(vsYesterday * 10) / 10,
        vsLastWeek: Math.round(vsLastWeek * 10) / 10,
        activeOrders: activeOrders.count || 0,
        inventoryAlerts: {
          lowStock: inventoryAlerts.low_stock_count || 0,
          expiring: inventoryAlerts.expiring_count || 0,
          expired: inventoryAlerts.expired_count || 0
        },
        clockedInStaff: clockedInStaff,
        laborCost: {
          total: laborCost.total_labor_cost || 0,
          hours: laborCost.total_hours || 0,
          percentage: todaySales.total_sales > 0 
            ? Math.round((laborCost.total_labor_cost / todaySales.total_sales) * 100 * 10) / 10
            : 0
        },
        cashOnHand: tillBalance.cash_on_hand || 0,
        avgFulfillmentTime: Math.round(avgFulfillmentTime.avg_minutes || 0)
      };
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get sales trend data for chart
   */
  async getSalesTrend(businessId, period = 'week') {
    try {
      const database = db.getDb();
      let days;
      
      if (period === 'week') {
        days = 7;
      } else if (period === 'month') {
        days = 30;
      } else {
        days = 7; // default
      }
      
      // Calculate start date for the trend
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().slice(0, 10) + ' 00:00:00';
      
      const query = `
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total), 0) as total_sales,
          COUNT(*) as order_count
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      
      const results = queryAll(database, query, [businessId, startDateStr]);
      
      console.log('📈 Sales trend results:', results);
      
      return results.map(row => ({
        date: row.date,
        sales: row.total_sales,
        orders: row.order_count
      }));
    } catch (error) {
      console.error('Error getting sales trend:', error);
      throw error;
    }
  }

  /**
   * Get top performing items and employees
   */
  async getTopPerformers(businessId, period = 'today') {
    try {
      const database = db.getDb();
      const todayDate = new Date();
      const today = todayDate.getFullYear() + '-' + 
        String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(todayDate.getDate()).padStart(2, '0');
      
      let dateFilter;
      if (period === 'today') {
        dateFilter = `DATE(t.created_at) = '${today}'`;
      } else if (period === 'week') {
        dateFilter = `DATE(t.created_at) >= DATE('now', '-7 days')`;
      } else if (period === 'month') {
        dateFilter = `DATE(t.created_at) >= DATE('now', '-30 days')`;
      }
      
      // Top 5 selling items
      const topItems = queryAll(database, `
        SELECT 
          mi.name as item_name,
          mc.name as category,
          SUM(ti.quantity) as total_quantity,
          SUM(ti.total_price) as total_revenue,
          mi.price,
          mi.cost,
          SUM(ti.total_price - (mi.cost * ti.quantity)) as total_profit
        FROM transaction_items ti
        JOIN transactions t ON ti.transaction_id = t.id
        JOIN menu_items mi ON ti.menu_item_id = mi.id
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id
        WHERE t.business_id = ? 
          AND t.status = 'completed'
          AND ${dateFilter}
        GROUP BY mi.id
        ORDER BY total_quantity DESC
        LIMIT 5
      `, [businessId]);
      
      console.log('🏆 Top items query result:', topItems);
      
      // Top performing employees (by sales)
      const topEmployees = queryAll(database, `
        SELECT 
          u.full_name,
          u.role,
          COUNT(t.id) as transaction_count,
          COALESCE(SUM(t.total), 0) as total_sales
        FROM transactions t
        JOIN users u ON t.cashier_id = u.id
        WHERE t.business_id = ? 
          AND t.status = 'completed'
          AND ${dateFilter}
        GROUP BY u.id
        ORDER BY total_sales DESC
        LIMIT 5
      `, [businessId]);
      
      return {
        topItems: topItems.map(item => ({
          name: item.item_name,
          category: item.category,
          quantity: item.total_quantity,
          revenue: item.total_revenue,
          profit: item.total_profit
        })),
        topEmployees: topEmployees.map(emp => ({
          name: emp.full_name,
          role: emp.role,
          transactions: emp.transaction_count,
          sales: emp.total_sales
        }))
      };
    } catch (error) {
      console.error('Error getting top performers:', error);
      throw error;
    }
  }

  /**
   * Get inventory status summary
   */
  async getInventoryStatus(businessId) {
    try {
      const database = db.getDb();
      
      const inventoryStats = queryOne(database, `
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as critical_low,
          COUNT(CASE WHEN expiry_date IS NOT NULL AND DATE(expiry_date) <= DATE('now', '+3 days') THEN 1 END) as expiring_soon,
          COALESCE(SUM(quantity * unit_cost), 0) as total_value
        FROM inventory_items
        WHERE business_id = ?
      `, [businessId]);
      
      // Get items that are critically low
      const criticalItems = queryAll(database, `
        SELECT name, quantity, min_quantity, unit
        FROM inventory_items
        WHERE business_id = ?
          AND quantity <= min_quantity
        ORDER BY (quantity - min_quantity) ASC
        LIMIT 5
      `, [businessId]);
      
      return {
        totalItems: inventoryStats.total_items,
        criticalLow: inventoryStats.critical_low,
        expiringSoon: inventoryStats.expiring_soon,
        totalValue: inventoryStats.total_value,
        criticalItems: criticalItems
      };
    } catch (error) {
      console.error('Error getting inventory status:', error);
      throw error;
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(businessId, period = 'today') {
    try {
      const database = db.getDb();
      const today = new Date().toISOString().split('T')[0];
      
      let dateFilter, label;
      if (period === 'today') {
        dateFilter = today;
        label = 'today';
      } else if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString().split('T')[0];
        label = 'this week';
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        dateFilter = monthAgo.toISOString().split('T')[0];
        label = 'this month';
      }
      
      // Revenue
      const startDateTime = dateFilter + ' 00:00:00';
      const revenue = queryOne(database, `
        SELECT COALESCE(SUM(total), 0) as total
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
      `, [businessId, startDateTime]);
      
      // Expenses
      const expenses = queryOne(database, `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE business_id = ?
          AND expense_date >= ?
          AND category != 'Till Balance'
      `, [businessId, dateFilter]);
      
      // Labor cost
      const laborCost = queryOne(database, `
        SELECT 
          COALESCE(SUM(
            ((JULIANDAY(COALESCE(tl.clock_out, 'now')) - JULIANDAY(tl.clock_in)) * 24) * e.hourly_rate
          ), 0) as total
        FROM time_logs tl
        JOIN employees e ON tl.employee_id = e.id
        WHERE e.business_id = ?
          AND tl.clock_in >= ?
      `, [businessId, startDateTime]);
      
      const totalRevenue = revenue.total || 0;
      const totalExpenses = (expenses.total || 0) + (laborCost.total || 0);
      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      return {
        period: label,
        revenue: totalRevenue,
        expenses: totalExpenses,
        laborCost: laborCost.total || 0,
        profit: profit,
        profitMargin: Math.round(profitMargin * 10) / 10
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }

  /**
   * Get upcoming items (schedules, orders, time-off requests)
   */
  async getUpcomingItems(businessId) {
    try {
      const database = db.getDb();
      const now = new Date().toISOString();
      
      // Next shift starting soon (within 2 hours)
      const upcomingShifts = queryAll(database, `
        SELECT 
          s.id,
          s.shift_date,
          s.start_time,
          s.end_time,
          u.full_name as employee_name
        FROM shifts s
        JOIN users u ON s.employee_id = u.id
        WHERE s.business_id = ?
          AND datetime(s.shift_date || ' ' || s.start_time) >= datetime('now')
          AND datetime(s.shift_date || ' ' || s.start_time) <= datetime('now', '+2 hours')
        ORDER BY datetime(s.shift_date || ' ' || s.start_time) ASC
        LIMIT 5
      `, [businessId]);
      
      // Pending time-off requests
      const timeOffRequests = queryAll(database, `
        SELECT 
          tr.id,
          tr.start_date,
          tr.end_date,
          tr.reason,
          u.full_name as employee_name
        FROM time_off_requests tr
        JOIN employees e ON tr.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.business_id = ?
          AND tr.status = 'pending'
        ORDER BY tr.created_at DESC
        LIMIT 5
      `, [businessId]);
      
      // Low stock items needing reorder
      const reorderItems = queryAll(database, `
        SELECT name, quantity, min_quantity
        FROM inventory_items
        WHERE business_id = ?
          AND quantity <= min_quantity * 1.2
        ORDER BY (quantity - min_quantity) ASC
        LIMIT 5
      `, [businessId]);
      
      return {
        upcomingShifts: upcomingShifts,
        timeOffRequests: timeOffRequests,
        reorderItems: reorderItems
      };
    } catch (error) {
      console.error('Error getting upcoming items:', error);
      throw error;
    }
  }

  /**
   * Get recent activity feed
   */
  async getActivityFeed(businessId, limit = 20) {
    try {
      const database = db.getDb();
      
      // Get recent transactions
      const recentTransactions = queryAll(database, `
        SELECT 
          'transaction' as type,
          t.id,
          t.total,
          t.status,
          t.created_at as timestamp,
          u.full_name as cashier_name
        FROM transactions t
        LEFT JOIN users u ON t.cashier_id = u.id
        WHERE t.business_id = ?
        ORDER BY t.created_at DESC
        LIMIT ${Math.floor(limit / 3)}
      `, [businessId]);
      
      // Get recent inventory adjustments
      const recentInventory = queryAll(database, `
        SELECT 
          'inventory' as type,
          it.id,
          it.transaction_type,
          it.quantity,
          it.created_at as timestamp,
          ii.name as item_name,
          u.full_name as user_name
        FROM inventory_transactions it
        JOIN inventory_items ii ON it.item_id = ii.id
        LEFT JOIN users u ON it.created_by = u.id
        WHERE ii.business_id = ?
        ORDER BY it.created_at DESC
        LIMIT ${Math.floor(limit / 3)}
      `, [businessId]);
      
      // Get recent clock in/outs
      const recentTimeLogs = queryAll(database, `
        SELECT 
          'timelog' as type,
          tl.id,
          tl.clock_in,
          tl.clock_out,
          tl.clock_in as timestamp,
          u.full_name as employee_name
        FROM time_logs tl
        JOIN employees e ON tl.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.business_id = ?
        ORDER BY tl.clock_in DESC
        LIMIT ${Math.floor(limit / 3)}
      `, [businessId]);
      
      // Combine and sort all activities
      const allActivities = [
        ...recentTransactions.map(t => ({
          type: 'transaction',
          id: t.id,
          timestamp: t.timestamp,
          description: `${t.cashier_name || 'Staff'} completed a $${t.total.toFixed(2)} transaction`,
          status: t.status
        })),
        ...recentInventory.map(i => ({
          type: 'inventory',
          id: i.id,
          timestamp: i.timestamp,
          description: `${i.user_name || 'Staff'} ${i.transaction_type} ${Math.abs(i.quantity_change)} units of ${i.item_name}`,
          status: i.transaction_type
        })),
        ...recentTimeLogs.map(tl => ({
          type: 'timelog',
          id: tl.id,
          timestamp: tl.timestamp,
          description: `${tl.employee_name} clocked ${tl.clock_out ? 'out' : 'in'}`,
          status: tl.clock_out ? 'clock_out' : 'clock_in'
        }))
      ];
      
      // Sort by timestamp and limit
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return allActivities.slice(0, limit);
    } catch (error) {
      console.error('Error getting activity feed:', error);
      throw error;
    }
  }

  /**
   * Get system alerts
   */
  async getAlerts(businessId) {
    try {
      const database = db.getDb();
      const alerts = [];
      
      // Critical inventory alerts
      const criticalInventory = queryOne(database, `
        SELECT COUNT(*) as count
        FROM inventory_items
        WHERE business_id = ? 
          AND min_quantity IS NOT NULL 
          AND quantity <= min_quantity
      `, [businessId]);
      
      if (criticalInventory.count > 0) {
        alerts.push({
          type: 'critical',
          category: 'inventory',
          message: `${criticalInventory.count} items are at or below minimum stock level`,
          action: 'View Inventory'
        });
      }
      
      // Expired items - only count items with valid expiry dates in the past
      const expiredItems = queryOne(database, `
        SELECT COUNT(*) as count
        FROM inventory_items
        WHERE business_id = ? 
          AND expiry_date IS NOT NULL 
          AND expiry_date != ''
          AND LENGTH(TRIM(expiry_date)) > 0
          AND DATE(expiry_date) > '1970-01-01'
          AND DATE(expiry_date) < DATE('now')
      `, [businessId]);
      
      if (expiredItems.count > 0) {
        alerts.push({
          type: 'critical',
          category: 'inventory',
          message: `${expiredItems.count} items have expired`,
          action: 'View Inventory'
        });
      }
      
      // Expiring soon - only count items with valid future dates
      const expiringSoon = queryOne(database, `
        SELECT COUNT(*) as count
        FROM inventory_items
        WHERE business_id = ? 
          AND expiry_date IS NOT NULL
          AND expiry_date != ''
          AND LENGTH(TRIM(expiry_date)) > 0
          AND DATE(expiry_date) > '1970-01-01'
          AND DATE(expiry_date) BETWEEN DATE('now') AND DATE('now', '+3 days')
      `, [businessId]);
      
      if (expiringSoon.count > 0) {
        alerts.push({
          type: 'warning',
          category: 'inventory',
          message: `${expiringSoon.count} items expiring within 3 days`,
          action: 'View Inventory'
        });
      }
      
      // Overtime approaching
      // Calculate start of current week (Sunday)
      const weekStart = new Date();
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      const weekStartStr = weekStart.toISOString().slice(0, 10) + ' 00:00:00';
      
      const overtimeStaff = queryAll(database, `
        SELECT 
          u.full_name,
          SUM((JULIANDAY(COALESCE(tl.clock_out, 'now')) - JULIANDAY(tl.clock_in)) * 24) as total_hours
        FROM time_logs tl
        JOIN employees e ON tl.employee_id = e.id
        JOIN users u ON e.user_id = u.id
        WHERE e.business_id = ?
          AND tl.clock_in >= ?
        GROUP BY u.id
        HAVING total_hours >= 38
      `, [businessId, weekStartStr]);
      
      overtimeStaff.forEach(staff => {
        alerts.push({
          type: 'warning',
          category: 'labor',
          message: `${staff.full_name} approaching overtime (${Math.round(staff.total_hours)} hours this week)`,
          action: 'View Schedule'
        });
      });
      
      // Pending time-off requests
      const pendingRequests = queryOne(database, `
        SELECT COUNT(*) as count
        FROM time_off_requests tr
        JOIN employees e ON tr.employee_id = e.id
        WHERE e.business_id = ? AND tr.status = 'pending'
      `, [businessId]);
      
      if (pendingRequests.count > 0) {
        alerts.push({
          type: 'info',
          category: 'schedule',
          message: `${pendingRequests.count} time-off requests pending approval`,
          action: 'View Requests'
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }

  /**
   * Get live orders for real-time dashboard
   */
  async getLiveOrders(businessId) {
    try {
      const database = db.getDb();
      const today = new Date().toISOString().split('T')[0];
      const todayStart = today + ' 00:00:00';
      const todayEnd = today + ' 23:59:59';
      
      const orders = queryAll(database, `
        SELECT 
          t.id,
          t.total,
          t.status,
          t.created_at,
          u.full_name as cashier_name
        FROM transactions t
        LEFT JOIN users u ON t.cashier_id = u.id
        WHERE t.business_id = ?
          AND t.status IN ('pending', 'processing', 'ready')
          AND t.created_at >= ? AND t.created_at <= ?
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [businessId, todayStart, todayEnd]);
      
      // Get items for each order
      const ordersWithItems = orders.map(order => {
        const items = queryAll(database, `
          SELECT 
            ti.quantity,
            mi.name
          FROM transaction_items ti
          JOIN menu_items mi ON ti.menu_item_id = mi.id
          WHERE ti.transaction_id = ?
        `, [order.id]);
        
        return {
          ...order,
          items
        };
      });
      
      return ordersWithItems;
    } catch (error) {
      console.error('Error getting live orders:', error);
      throw error;
    }
  }

  /**
   * Get profit pulse status
   */
  async getProfitPulse(businessId) {
    try {
      const financialSummary = await this.getFinancialSummary(businessId, 'today');
      
      let status = 'neutral';
      let message = 'Business is operating normally';
      
      if (financialSummary.profitMargin > 15) {
        status = 'positive';
        message = 'Excellent! Profit margins are strong and above target';
      } else if (financialSummary.profitMargin > 8) {
        status = 'positive';
        message = 'Good! Business is profitable and on track';
      } else if (financialSummary.profitMargin > 0) {
        status = 'neutral';
        message = 'Margins are tight but still profitable';
      } else {
        status = 'negative';
        message = 'Alert: Business is operating at a loss today';
      }
      
      return {
        status,
        message,
        profit: financialSummary.profit,
        profitMargin: financialSummary.profitMargin
      };
    } catch (error) {
      console.error('Error getting profit pulse:', error);
      throw error;
    }
  }

  /**
   * Get goal tracking data
   */
  async getGoalTracking(businessId) {
    try {
      const database = db.getDb();
      const todayDate = new Date();
      const today = todayDate.getFullYear() + '-' + 
        String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(todayDate.getDate()).padStart(2, '0');
      
      // Get today's sales
      const todayStart = today + ' 00:00:00';
      const todayEnd = today + ' 23:59:59';
      const todaySales = queryOne(database, `
        SELECT COALESCE(SUM(total), 0) as total
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
          AND created_at <= ?
      `, [businessId, todayStart, todayEnd]);
      
      // Get this month's sales
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.getFullYear() + '-' + 
        String(monthStart.getMonth() + 1).padStart(2, '0') + '-01';
      
      const monthStartDateTime = monthStartStr + ' 00:00:00';
      const monthSales = queryOne(database, `
        SELECT COALESCE(SUM(total), 0) as total
        FROM transactions
        WHERE business_id = ? 
          AND status = 'completed'
          AND created_at >= ?
      `, [businessId, monthStartDateTime]);
      
      // Default goals (can be stored in settings table)
      const dailyGoal = 1000;
      const monthlyGoal = 25000;
      
      const dailyProgress = (todaySales.total / dailyGoal) * 100;
      const monthlyProgress = (monthSales.total / monthlyGoal) * 100;
      
      return {
        daily: {
          current: todaySales.total,
          goal: dailyGoal,
          progress: Math.min(dailyProgress, 100),
          status: dailyProgress >= 100 ? 'achieved' : dailyProgress >= 75 ? 'on-track' : 'behind'
        },
        monthly: {
          current: monthSales.total,
          goal: monthlyGoal,
          progress: Math.min(monthlyProgress, 100),
          status: monthlyProgress >= 100 ? 'achieved' : monthlyProgress >= 75 ? 'on-track' : 'behind'
        }
      };
    } catch (error) {
      console.error('Error getting goal tracking:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data in one call
   */
  async getCompleteDashboard(businessId, userRole) {
    try {
      const overview = await this.getDashboardOverview(businessId);
      const salesTrend = await this.getSalesTrend(businessId, 'week');
      const topPerformers = await this.getTopPerformers(businessId, 'week');
      const inventoryStatus = await this.getInventoryStatus(businessId);
      const upcomingItems = await this.getUpcomingItems(businessId);
      const activityFeed = await this.getActivityFeed(businessId, 15);
      const alerts = await this.getAlerts(businessId);
      const liveOrders = await this.getLiveOrders(businessId);
      const profitPulse = await this.getProfitPulse(businessId);
      const goalTracking = await this.getGoalTracking(businessId);
      
      let financialSummary = null;
      if (['admin', 'manager'].includes(userRole)) {
        financialSummary = await this.getFinancialSummary(businessId, 'today');
      }
      
      return {
        overview,
        salesTrend,
        topPerformers,
        inventoryStatus,
        financialSummary,
        upcomingItems,
        activityFeed,
        alerts,
        liveOrders,
        profitPulse,
        goalTracking
      };
    } catch (error) {
      console.error('Error getting complete dashboard:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();

