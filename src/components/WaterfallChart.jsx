import React, { useMemo, useState } from 'react';
import { CalculatorEngine } from '../logic/CalculatorEngine';

export function WaterfallChart() {
  // Step definitions based on user requirements
  const steps = [
    {
      id: 1,
      name: "1. 初始成本",
      desc: "电价0.20 | 制氢投资3000 | 效率60% | 运维14% | 甲烷投资5500",
      modifications: {
        electricityPrice: 0.20,
        synthesisElecPrice: 0.20,
        h2PlantUnitCost: 3000,
        efficiency: 0.60,
        h2OpExRatio: 0.14,
        methanePlantUnitCost: 5500
      }
    },
    {
      id: 2,
      name: "2. 效率提升",
      desc: "制氢转换效率 60% → 65%",
      modifications: {
        efficiency: 0.65
      }
    },
    {
      id: 3,
      name: "3. 电价一降",
      desc: "电价 0.20 → 0.15",
      modifications: {
        electricityPrice: 0.15,
        synthesisElecPrice: 0.15
      }
    },
    {
      id: 4,
      name: "4. 运维降本",
      desc: "制氢运维占比 14% → 5%",
      modifications: {
        h2OpExRatio: 0.05
      }
    },
    {
      id: 5,
      name: "5. 制氢降本",
      desc: "制氢投资 3000 → 2100",
      modifications: {
        h2PlantUnitCost: 2100
      }
    },
    {
      id: 6,
      name: "6. 合成降本",
      desc: "甲烷投资 5500 → 2750",
      modifications: {
        methanePlantUnitCost: 2750
      }
    },
    {
      id: 7,
      name: "7. 电价二降",
      desc: "电价 0.15 → 0.10",
      modifications: {
        electricityPrice: 0.10,
        synthesisElecPrice: 0.10
      }
    }
  ];

  const calculatedData = useMemo(() => {
    // Determine baseline parameters from engine defaults
    const baselineEngine = new CalculatorEngine({});
    const baseParams = baselineEngine.params;

    let currentParams = { ...baseParams };
    const results = [];

    let previousCost = 0;

    steps.forEach((step, index) => {
      // Accumulate modifications
      currentParams = { ...currentParams, ...step.modifications };

      const engine = new CalculatorEngine(currentParams);
      const res = engine.calculate();

      const currentCost = parseFloat(res.metrics.eMethaneCost);
      const diff = index === 0 ? currentCost : currentCost - previousCost;

      results.push({
        ...step,
        cost: currentCost,
        previousCost: previousCost, // Track this specifically for the css offset
        diff: diff,
        isBase: index === 0
      });

      previousCost = currentCost;
    });

    return results;
  }, []);

  const [hoverIndex, setHoverIndex] = useState(null);

  // Maximum cost for chart scaling
  const maxCost = Math.max(...calculatedData.map(d => d.cost)) * 1.1;

  return (
    <div className="waterfall-card">
      <div className="waterfall-header">
        <h3>e-甲烷降本路径瀑布图</h3>
        <p>假设合成用电与制氢用电成本一致，展现7个关键阶段的系统性降本效果</p>
      </div>

      <div className="waterfall-chart-container">
        {calculatedData.map((item, i) => {
          const isNegative = item.diff < 0;
          const barHeightPercentage = item.isBase
            ? (item.cost / maxCost) * 100
            : (Math.abs(item.diff) / maxCost) * 100;

          // Bottom offset for the bar to "float" or "stack" correctly
          // For positive diffs, bar starts at previousCost. For negative diffs, bar starts at currentCost.
          let baseValueForOffset = item.isBase ? 0 : (isNegative ? item.cost : item.previousCost);

          const bottomOffsetPercentage = (baseValueForOffset / maxCost) * 100;

          // Label calculation: Should be sitting at the very top of the bar.
          // If base: cost. If regular step: Math.max(cost, previousCost).
          let topOfBarValue = item.isBase ? item.cost : Math.max(item.cost, item.previousCost);
          const topLabelOffsetPercentage = (topOfBarValue / maxCost) * 100;

          const isHovered = hoverIndex === i;

          return (
            <div
              className="waterfall-column"
              key={item.id}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <div className="waterfall-track">
                {/* Cost Label */}
                <div
                  className="waterfall-label"
                  style={{ bottom: `${topLabelOffsetPercentage + 2}%` }}
                >
                  ¥{item.cost.toFixed(2)}
                </div>

                {/* The Bar */}
                <div
                  className={`waterfall-bar ${item.isBase ? 'base-bar' : 'diff-bar'} ${isHovered ? 'hovered' : ''}`}
                  style={{
                    height: `${barHeightPercentage}%`,
                    bottom: `${bottomOffsetPercentage}%`,
                    background: item.isBase ? '' : (isNegative ? 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' : 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)')
                  }}
                >
                  {!item.isBase && (
                    <span className="diff-text">
                      {isNegative ? '' : '+'}{item.diff.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="waterfall-x-label">
                <span>{item.name}</span>
                {isHovered && (
                  <div className="waterfall-tooltip">
                    {item.desc}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
