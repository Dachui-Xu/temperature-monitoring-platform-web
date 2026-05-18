import React, { useState, useMemo, useRef } from 'react';
import { Download, Calendar, ChevronDown, Check, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../Button';

// Define device options for selector
const DEVICE_OPTIONS = [
  { id: '1', name: '中心机房 A01' },
  { id: '2', name: '冷链仓库 B02' },
  { id: '3', name: '生化实验室 C03' },
  { id: '4', name: '样本库 D04' },
  { id: '5', name: '备用机房 E05' },
];

const PERIOD_OPTIONS = [
  { label: '1小时', value: '1h' },
  { label: '24小时', value: '24h' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
];

export const HistoryAnalysis: React.FC = () => {
  const [period, setPeriod] = useState('24h');
  const [selectedDeviceId, setSelectedDeviceId] = useState('1');
  
  // Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [hoverData, setHoverData] = useState<{x: number, y: number, value: number, time: string} | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedDeviceName = DEVICE_OPTIONS.find(d => d.id === selectedDeviceId)?.name || '未知设备';

  // Generate STABLE mock data based on selected device, period, and date range
  const chartData = useMemo(() => {
    // 默认为24点
    let points = 24; 
    let labelFormat = (i: number) => `${String(i).padStart(2, '0')}:00`;
    
    // 如果选择了具体的日期范围
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays <= 1) {
        // Same day or 1 day difference: Show hourly
        points = 24;
        labelFormat = (i) => `${String(i).padStart(2, '0')}:00`;
      } else {
        // Multiple days: Show daily points
        points = diffDays + 1; // Include start and end
        labelFormat = (i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        };
      }
    } else {
      // Fallback to period buttons logic
      if (period === '1h') {
        points = 12; // Every 5 minutes
        labelFormat = (i) => {
          const m = i * 5;
          return `00:${String(m).padStart(2, '0')}`;
        };
      } else if (period === '24h') {
        points = 24; // Hourly
        labelFormat = (i) => `${String(i).padStart(2, '0')}:00`;
      } else if (period === '7d') {
        points = 7; // Daily
        labelFormat = (i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return `${d.getMonth() + 1}/${d.getDate()}`;
        };
      } else if (period === '30d') {
        points = 15; // Every 2 days
        labelFormat = (i) => {
          const d = new Date();
          d.setDate(d.getDate() - (28 - i * 2));
          return `${d.getMonth() + 1}/${d.getDate()}`;
        };
      }
    }

    const baseTemp = selectedDeviceId === '2' ? -18 : 22;
    const volatility = selectedDeviceId === '3' ? 3 : 1;
    
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const dateFactor = startDate ? new Date(startDate).getDate() : 0;
    const safeDateFactor = isNaN(dateFactor) ? 0 : dateFactor;

    return Array.from({ length: points }, (_, i) => {
      const seed = i + Number(selectedDeviceId) * 100 + (period.length * 50) + safeDateFactor;
      const noise = (pseudoRandom(seed) - 0.5) * volatility * 2;
      const trend = Math.sin(i / (points / 6)) * 2; 
      
      return {
        label: labelFormat(i),
        value: Number((baseTemp + trend + noise).toFixed(1))
      };
    });
  }, [selectedDeviceId, period, startDate, endDate]);

  const maxVal = Math.max(...chartData.map(d => d.value)) + 2;
  const minVal = Math.min(...chartData.map(d => d.value)) - 2;
  const range = maxVal - minVal;
  const width = 1000;
  const height = 300;

  const stats = useMemo(() => {
    const values = chartData.map(d => d.value);
    return {
      max: Math.max(...values).toFixed(1),
      min: Math.min(...values).toFixed(1),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    };
  }, [chartData]);

  const getX = (index: number) => (index / (chartData.length - 1)) * width;
  const getY = (value: number) => height - ((value - minVal) / range) * height;

  const pathD = useMemo(() => {
    return chartData.map((d, i) => {
      const x = getX(i);
      const y = getY(d.value);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');
  }, [chartData, minVal, range]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = (x / rect.width) * width;
    
    const index = Math.round((relativeX / width) * (chartData.length - 1));
    if (index >= 0 && index < chartData.length) {
      const point = chartData[index];
      setHoverData({
        x: getX(index),
        y: getY(point.value),
        value: point.value,
        time: point.label
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    setExporting(type);
    setTimeout(() => {
      setExporting(null);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    }, 1500);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    // Clearing period preset when manually selecting date
    setPeriod(''); 
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setPeriod('');
  };

  const handlePeriodClick = (pVal: string) => {
    setPeriod(pVal);
    // Clear custom dates when clicking a preset
    setStartDate('');
    setEndDate('');
  };

  const warningThreshold = 24.0;
  const criticalLowThreshold = -20.0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Toasts */}
      {showExportSuccess && (
        <div className="absolute top-0 right-0 z-20 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center animate-in slide-in-from-top-2 fade-in">
          <Check className="h-4 w-4 text-green-400 mr-2" />
          文件导出成功，下载已开始
        </div>
      )}

      {/* Controls Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative z-10">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative">
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="appearance-none bg-gray-50 pl-4 pr-10 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {DEVICE_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePeriodClick(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p.value
                    ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center w-full xl:w-auto">
           <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
             <div className="relative flex items-center">
               <input 
                 type="date" 
                 value={startDate}
                 onChange={handleStartDateChange}
                 className="pl-2 pr-1 py-1.5 bg-transparent text-xs font-medium text-gray-700 focus:outline-none cursor-pointer w-32"
               />
             </div>
             <span className="text-gray-400 px-1"><ArrowRight className="h-3 w-3" /></span>
             <div className="relative flex items-center">
               <input 
                 type="date" 
                 value={endDate}
                 onChange={handleEndDateChange}
                 className="pl-2 pr-1 py-1.5 bg-transparent text-xs font-medium text-gray-700 focus:outline-none cursor-pointer w-32"
               />
             </div>
           </div>
           
           {(startDate || endDate) && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => { setStartDate(''); setEndDate(''); setPeriod('24h'); }}
               className="text-xs text-gray-500"
             >
               重置
             </Button>
           )}
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative z-0">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">温度趋势分析</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDeviceName} 
              {startDate && endDate ? ` • ${startDate} 至 ${endDate}` : ` • 最近 ${PERIOD_OPTIONS.find(p=>p.value === period)?.label || '自定义时间'}`}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="px-2 border-r border-gray-200">
              <span className="text-gray-400 text-xs block">最高</span>
              <span className="font-bold text-gray-900">{stats.max}°C</span>
            </div>
            <div className="px-2 border-r border-gray-200">
              <span className="text-gray-400 text-xs block">最低</span>
              <span className="font-bold text-gray-900">{stats.min}°C</span>
            </div>
            <div className="px-2">
              <span className="text-gray-400 text-xs block">平均</span>
              <span className="font-bold text-gray-900">{stats.avg}°C</span>
            </div>
          </div>
        </div>

        {/* Chart Visual */}
        <div className="relative h-[320px] w-full pb-6 select-none group">
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full overflow-visible cursor-crosshair" 
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <g key={i}>
                <line 
                  x1="0" y1={p * height} 
                  x2={width} y2={p * height} 
                  stroke="#f1f5f9" strokeWidth="1" 
                />
                <text x="-15" y={p * height + 4} textAnchor="end" fontSize="10" fill="#cbd5e1" fontWeight="500">
                  {(maxVal - p * range).toFixed(0)}°
                </text>
              </g>
            ))}
            
            {/* Area Fill */}
            <path
              d={`${pathD} L ${width},${height} L 0,${height} Z`}
              fill="url(#chartGradient)"
              className="opacity-0 transition-opacity duration-700 ease-out"
              style={{opacity: 1}} 
            />
            
            {/* The Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="drop-shadow-sm"
            />

            {/* Abnormal Points */}
            {chartData.map((d, i) => {
              if (d.value > warningThreshold || d.value < criticalLowThreshold) {
                return (
                   <circle 
                    key={i}
                    cx={getX(i)} 
                    cy={getY(d.value)} 
                    r="4" 
                    fill="#ef4444" 
                    stroke="white" 
                    strokeWidth="2" 
                    className="animate-pulse"
                  />
                );
              }
              return null;
            })}

            {/* Interactive Tooltip */}
            {hoverData && (
              <g>
                <line 
                  x1={hoverData.x} y1="0" 
                  x2={hoverData.x} y2={height} 
                  stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" 
                />
                <circle 
                  cx={hoverData.x} cy={hoverData.y} 
                  r="6" fill="#2563eb" stroke="white" strokeWidth="3" 
                  className="shadow-lg transition-all duration-75"
                />
                
                {/* Tooltip Box */}
                <foreignObject 
                  x={Math.min(hoverData.x + 15, width - 140)} 
                  y={Math.min(hoverData.y - 40, height - 70)} 
                  width="130" 
                  height="60"
                >
                  <div className="bg-gray-900/90 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-white/10 text-xs">
                     <div className="text-gray-400 mb-1">{hoverData.time}</div>
                     <div className="text-lg font-bold flex items-center">
                       {hoverData.value.toFixed(1)} <span className="text-xs ml-1 text-gray-400">°C</span>
                     </div>
                  </div>
                </foreignObject>
              </g>
            )}
          </svg>
          
          {/* X-Axis Labels */}
          <div className="flex justify-between mt-4 text-xs text-gray-400 px-2 font-medium">
            {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <h4 className="font-semibold text-gray-900 mb-4">数据质量统计</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-600 text-sm">数据点采样数</span>
               <span className="font-mono font-bold text-gray-900">{chartData.length * 60}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-600 text-sm">异常波动次数</span>
               <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                 {chartData.filter(d => d.value > warningThreshold || d.value < criticalLowThreshold).length}
               </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
               <span className="text-gray-600 text-sm">传感器在线率</span>
               <span className="font-mono font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">99.9%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4">数据导出</h4>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              fullWidth 
              className="justify-between h-auto py-4 px-4 bg-white hover:bg-gray-50 border-gray-200 group"
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mr-3 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">原始数据 (CSV)</div>
                  <div className="text-xs text-gray-500">适用于 Excel 分析</div>
                </div>
              </div>
              {exporting === 'csv' ? <span className="text-xs animate-pulse text-gray-400">生成中...</span> : <Download className="h-4 w-4 text-gray-400 group-hover:text-brand-600" />}
            </Button>

            <Button 
              variant="outline" 
              fullWidth 
              className="justify-between h-auto py-4 px-4 bg-white hover:bg-gray-50 border-gray-200 group"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 mr-3 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">每日报告 (PDF)</div>
                  <div className="text-xs text-gray-500">包含图表和统计摘要</div>
                </div>
              </div>
              {exporting === 'pdf' ? <span className="text-xs animate-pulse text-gray-400">生成中...</span> : <Download className="h-4 w-4 text-gray-400 group-hover:text-brand-600" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};