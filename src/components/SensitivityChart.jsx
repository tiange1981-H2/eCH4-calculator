import React, { useMemo, useState } from 'react';
import { CalculatorEngine } from '../logic/CalculatorEngine';
import '../index.css';

export function SensitivityChart() {
    const [variation, setVariation] = useState(0.20); // 默认 ±20% 的变化

    // 用户指定的基准(中值)参数
    const baseParams = {
        efficiency: 0.65,           // 制氢效率 65%
        electricityPrice: 0.20,     // 电价 0.2
        synthesisElecPrice: 0.20,   // 合成用电与制氢用电成本一致
        h2OpExRatio: 0.10,          // 运维 10%
        methaneOpExRatio: 0.10,     // 合成运维统一按 10%
        h2PlantUnitCost: 3000,      // 制氢投资 3000
        methanePlantUnitCost: 4000, // 甲烷化投资 4000
        wacc: 0.06,                 // WACC 6%
        runTimeYear: 8000           // 运行时长 8000h
    };

    const analysisItems = [
        { key: ['electricityPrice', 'synthesisElecPrice'], label: '电价 (元/kWh)', baseVal: baseParams.electricityPrice },
        { key: ['efficiency'], label: '制氢效率', baseVal: baseParams.efficiency, inverse: true }, // 效率提升会导致成本降低
        { key: ['h2PlantUnitCost'], label: '制氢投资 (元/kW)', baseVal: baseParams.h2PlantUnitCost },
        { key: ['methanePlantUnitCost'], label: '甲烷化投资', baseVal: baseParams.methanePlantUnitCost },
        { key: ['wacc'], label: 'WACC', baseVal: baseParams.wacc },
        { key: ['h2OpExRatio', 'methaneOpExRatio'], label: '运维占比', baseVal: baseParams.h2OpExRatio },
        { key: ['runTimeYear'], label: '运行时长(h)', baseVal: baseParams.runTimeYear, inverse: true } // 运行时长增加会导致成本降低
    ];

    const chartData = useMemo(() => {
        // 1. Calculate Base Cost
        const baseEngine = new CalculatorEngine(baseParams);
        const baseCost = parseFloat(baseEngine.calculate().metrics.eMethaneCost);

        // 2. Calculate variations
        let data = analysisItems.map(item => {
            // Create -variation parameters
            const lowParams = { ...baseParams };
            item.key.forEach(k => {
                lowParams[k] = baseParams[k] * (1 - variation);
            });
            const lowCost = parseFloat(new CalculatorEngine(lowParams).calculate().metrics.eMethaneCost);

            // Create +variation parameters
            const highParams = { ...baseParams };
            item.key.forEach(k => {
                highParams[k] = baseParams[k] * (1 + variation);
            });
            const highCost = parseFloat(new CalculatorEngine(highParams).calculate().metrics.eMethaneCost);

            // Deal with inverse relationships (like Efficiency: higher efficiency = lower cost)
            const downsideCost = item.inverse ? highCost : lowCost;
            const upsideCost = item.inverse ? lowCost : highCost;

            const swing = Math.abs(upsideCost - downsideCost);

            return {
                ...item,
                lowCost: downsideCost,
                highCost: upsideCost,
                swing: swing
            };
        });

        // Sort by largest swing to form the "Tornado" shape
        data.sort((a, b) => b.swing - a.swing);

        return { baseCost, data };
    }, [variation]);

    const { baseCost, data } = chartData;
    const maxSwingHalf = Math.max(...data.map(d => Math.max(Math.abs(d.highCost - baseCost), Math.abs(d.lowCost - baseCost)))) * 1.1;

    const [hoverIndex, setHoverIndex] = useState(null);

    return (
        <div className="tornado-card">
            <div className="waterfall-header">
                <h3>e-甲烷核心参数敏感性分析 (龙卷风图)</h3>
                <p>基准参数下 e-甲烷成本: <strong>¥{baseCost.toFixed(2)}</strong> /Nm³。探究单个参数在 ±{(variation * 100).toFixed(0)}% 波动时对最终成本的冲击。</p>
            </div>

            <div className="tornado-controls">
                <label>调整波动率幅度: </label>
                <input
                    type="range"
                    min="0.05" max="0.5" step="0.05"
                    value={variation}
                    onChange={e => setVariation(parseFloat(e.target.value))}
                />
                <span>±{(variation * 100).toFixed(0)}%</span>
            </div>

            <div className="tornado-chart-container">
                {/* Central Baseline */}
                <div className="tornado-center-line"></div>
                <div className="tornado-center-value">基准: ¥{baseCost.toFixed(2)}</div>

                {data.map((item, i) => {
                    // Calculate widths for CSS based strictly on distance from baseCost
                    const leftWidthPercent = (Math.abs(baseCost - Math.min(item.lowCost, item.highCost)) / maxSwingHalf) * 50;
                    const rightWidthPercent = (Math.abs(Math.max(item.lowCost, item.highCost) - baseCost) / maxSwingHalf) * 50;

                    // Which side is the downside (cheaper cost) vs upside (higher cost)
                    // Typically lower param (e.g. lower capex) -> lower cost (Downside, goes left)
                    // Higher param -> higher cost (Upside, goes right)
                    // Exception: Efficiency. Higher efficiency -> lower cost. Handled by Inverse flag earlier.

                    const isHovered = hoverIndex === i;

                    return (
                        <div
                            className="tornado-row"
                            key={item.label}
                            onMouseEnter={() => setHoverIndex(i)}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            <div className="tornado-label-col">{item.label}</div>

                            <div className="tornado-bars-col">
                                {/* Left Side (Cost Decrease / Value Down) */}
                                <div className="tornado-bar-side left-side">
                                    <div
                                        className={`tornado-bar bar-negative ${isHovered ? 'hovered' : ''}`}
                                        style={{ width: `${leftWidthPercent}%` }}
                                    >
                                        <span className="bar-val-text">{(Math.min(item.lowCost, item.highCost) - baseCost).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Right Side (Cost Increase / Value Up) */}
                                <div className="tornado-bar-side right-side">
                                    <div
                                        className={`tornado-bar bar-positive ${isHovered ? 'hovered' : ''}`}
                                        style={{ width: `${rightWidthPercent}%` }}
                                    >
                                        <span className="bar-val-text">+{(Math.max(item.lowCost, item.highCost) - baseCost).toFixed(2)}</span>
                                    </div>
                                </div>

                                {isHovered && (
                                    <div className="tornado-tooltip">
                                        终端成本: ¥{Math.min(item.lowCost, item.highCost).toFixed(2)} ~ ¥{Math.max(item.lowCost, item.highCost).toFixed(2)}
                                        <br />价差波动: {(Math.min(item.lowCost, item.highCost) - baseCost).toFixed(2)} ~ +{(Math.max(item.lowCost, item.highCost) - baseCost).toFixed(2)}
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
