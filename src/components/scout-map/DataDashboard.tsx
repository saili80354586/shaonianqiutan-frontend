import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, BarChart3, LayoutDashboard } from 'lucide-react';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';
import type { Player } from './types';

interface DataDashboardProps {
  players: Player[];
  totalCities: number;
  cityName: string;
  provinceName: string;
  onClose: () => void;
}

export function DataDashboard({ players, totalCities, cityName, provinceName, onClose }: DataDashboardProps) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-auto">
      {/* 头部 */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">数据看板</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span>{provinceName}</span>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-700">{cityName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            <BarChart3 className="w-3 h-3 mr-1" />
            实时数据
          </Badge>
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
            <X className="w-4 h-4" />
            关闭
          </Button>
        </div>
      </header>

      {/* 内容区 */}
      <main className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI 卡片 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            核心指标
          </h2>
          <DashboardKPIs players={players} totalCities={totalCities} />
        </section>

        {/* 图表区 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            数据洞察
          </h2>
          <DashboardCharts players={players} />
        </section>

        {/* 数据说明 */}
        <section>
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">关于数据看板</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  数据看板展示了当前城市的青少年足球人才数据分析。
                  包含球员分布、年龄结构、位置偏好、评分分布等多维度指标。
                  数据基于平台收集的注册球员信息，每日自动更新。
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
