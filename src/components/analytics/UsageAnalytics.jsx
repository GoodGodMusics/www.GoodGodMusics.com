import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Database, Zap, TrendingUp, 
  DollarSign, Clock, AlertCircle 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function UsageAnalytics() {
  const [period, setPeriod] = useState('7days');

  const { data: apiLogs = [] } = useQuery({
    queryKey: ['apiLogs', period],
    queryFn: async () => {
      const daysAgo = period === '7days' ? 7 : period === '30days' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const logs = await base44.entities.APIUsageLog.list('-created_date', 1000);
      return logs.filter(log => new Date(log.created_date) >= startDate);
    }
  });

  // Aggregate data
  const serviceBreakdown = apiLogs.reduce((acc, log) => {
    acc[log.service] = (acc[log.service] || 0) + (log.credits_used || 0);
    return acc;
  }, {});

  const functionBreakdown = apiLogs.reduce((acc, log) => {
    acc[log.function_name] = (acc[log.function_name] || 0) + (log.credits_used || 0);
    return acc;
  }, {});

  const totalCredits = apiLogs.reduce((sum, log) => sum + (log.credits_used || 0), 0);
  const totalBandwidth = apiLogs.reduce((sum, log) => sum + (log.bandwidth_bytes || 0), 0);
  const avgResponseTime = apiLogs.length > 0 
    ? apiLogs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / apiLogs.length 
    : 0;

  // Chart data
  const pieData = {
    labels: Object.keys(serviceBreakdown),
    datasets: [{
      data: Object.values(serviceBreakdown),
      backgroundColor: [
        '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899'
      ]
    }]
  };

  const barData = {
    labels: Object.keys(functionBreakdown).slice(0, 10),
    datasets: [{
      label: 'Credits Used',
      data: Object.values(functionBreakdown).slice(0, 10),
      backgroundColor: '#f59e0b'
    }]
  };

  // Daily usage trend
  const dailyUsage = apiLogs.reduce((acc, log) => {
    const date = new Date(log.created_date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + (log.credits_used || 0);
    return acc;
  }, {});

  const lineData = {
    labels: Object.keys(dailyUsage).slice(-14),
    datasets: [{
      label: 'Daily Credits',
      data: Object.values(dailyUsage).slice(-14),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.4
    }]
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">API Usage & Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total API Calls</p>
                <p className="text-2xl font-bold">{apiLogs.length.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Credits Used</p>
                <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Bandwidth</p>
                <p className="text-2xl font-bold">{formatBytes(totalBandwidth)}</p>
              </div>
              <Database className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Avg Response</p>
                <p className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Daily Credit Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Line 
              data={lineData} 
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Service Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Credits by Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Pie 
              data={pieData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Function Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Top Functions by Credit Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar 
            data={barData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(functionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([func, credits]) => (
                <div key={func} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800">{func}</p>
                      <p className="text-sm text-stone-600 mt-1">
                        Using {credits.toLocaleString()} credits
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">High Usage</Badge>
                  </div>
                  <p className="text-sm text-stone-600 mt-2">
                    💡 Consider: Implement caching or batch processing to reduce API calls
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}