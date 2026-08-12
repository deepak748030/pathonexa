const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

router.get('/stats', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayReports = await Report.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalRevenue = todayReports.reduce((sum, report) => sum + (report.amount || 0), 0);
    const pendingReports = await Report.countDocuments({ status: 'Pending' });
    const totalReportsCount = await Report.countDocuments();

    res.json([
      { key: 'reports', label: "Today's Reports", value: todayReports.length.toString(), sub: `Total: ${totalReportsCount}`, tone: 'primary' },
      { key: 'revenue', label: "Today's Revenue", value: `₹${totalRevenue.toLocaleString()}`, sub: 'Total Collection', tone: 'green' },
      { key: 'pending', label: 'Pending Reports', value: pendingReports.toString(), sub: 'Yet to Complete', tone: 'orange' },
      { key: 'amount', label: 'Pending Amount', value: '₹0', sub: 'Calculated from unpaid', tone: 'purple' },
      { key: 'commission', label: 'Doctor Commission', value: '₹0', sub: 'Pending Payout', tone: 'primary' },
      { key: 'expense', label: "Today's Expense", value: '₹0', sub: 'Total Expense', tone: 'red' }
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/chart', async (req, res) => {
  try {
    const days = 7;
    const labels = [];
    const values = [];
    
    // Get dates for last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
      
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      
      const count = await Report.countDocuments({
        createdAt: { $gte: start, $lte: end }
      });
      values.push(count);
    }

    const totalReports = values.reduce((a, b) => a + b, 0);
    
    // Total revenue for these 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - (days - 1));
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const reports = await Report.find({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    const totalRevenue = reports.reduce((sum, r) => sum + (r.amount || 0), 0);
    const avgPerDay = Math.round(totalReports / days);

    res.json({
      labels,
      values,
      totalReports: totalReports.toString(),
      totalRevenue: `₹${totalRevenue.toLocaleString()}`,
      avgPerDay: avgPerDay.toString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;