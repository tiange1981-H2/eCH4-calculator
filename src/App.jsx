import React, { useState, useMemo, useRef } from 'react';
import { CalculatorEngine } from './logic/CalculatorEngine';
import { WaterfallChart } from './components/WaterfallChart';
import { SensitivityChart } from './components/SensitivityChart';
import './index.css';

const INITIAL_PARAMS = {
  electricityPrice: 0.1,    // B43
  synthesisElecPrice: 0.1,  // B57
  h2Power: 100,             // B25
  runTimeYear: 4000,        // B26
  wacc: 0.04,               // B21
  serviceLife: 20,          // B22
  h2PlantUnitCost: 2100,    // B37
  efficiency: 0.65,         // B28
  h2OpExRatio: 0.05,        // B40
  h2LaborCost: 600,         // B42
  methaneEnergyLoss: 0.025, // B27
  methanePlantUnitCost: 2750,// B51
  methaneOpExRatio: 0.04,   // B54
  methaneLaborCost: 250,    // B56
  methaneRunTimeYear: 4000, // D52
  co2Price: 0               // B60
};

function App() {
  const [params, setParams] = useState(INITIAL_PARAMS);

  const [activeParam, setActiveParam] = useState(null); // Tracks which param slider is open on mobile
  const paramSectionRef = useRef(null);

  const scrollToParams = () => {
    paramSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setParams(INITIAL_PARAMS);
    setActiveParam(null);
  };

  const engine = useMemo(() => new CalculatorEngine(params), [params]);
  const results = useMemo(() => engine.calculate(), [engine]);

  const handleParamChange = (name, value) => {
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const toggleParam = (name) => {
    setActiveParam(activeParam === name ? null : name);
  };

  return (
    <div className="container">
      <header>
        <h1>氢基燃料成本计算器</h1>
        <p>基于电解水制氢及甲烷化生产逻辑的实时分析工具</p>
        <button className="mobile-params-toggle" onClick={scrollToParams}>
          ⚙️ 自定义工艺参数
        </button>
      </header>

      <main className="dashboard">
        <aside className="sidebar" ref={paramSectionRef}>
          <div className="card">
            <div className="param-group">
              <h3>核心通用参数</h3>
              <InputControl
                label="电解制氢电价 (元/kWh)"
                name="electricityPrice"
                value={params.electricityPrice}
                min={0} max={1} step={0.01}
                onChange={handleParamChange}
                isActive={activeParam === 'electricityPrice'}
                onToggle={() => toggleParam('electricityPrice')}
              />
              <InputControl
                label="甲烷合成电价 (元/kWh)"
                name="synthesisElecPrice"
                value={params.synthesisElecPrice}
                min={0} max={1} step={0.01}
                onChange={handleParamChange}
                isActive={activeParam === 'synthesisElecPrice'}
                onToggle={() => toggleParam('synthesisElecPrice')}
              />
              <InputControl
                label="折现率 WACC"
                name="wacc"
                value={params.wacc}
                min={0.01} max={0.15} step={0.01}
                onChange={handleParamChange}
                displayTransform={v => (v * 100).toFixed(0) + '%'}
                isActive={activeParam === 'wacc'}
                onToggle={() => toggleParam('wacc')}
              />
              <InputControl
                label="项目寿命 (年)"
                name="serviceLife"
                value={params.serviceLife}
                min={5} max={30} step={1}
                onChange={handleParamChange}
                isActive={activeParam === 'serviceLife'}
                onToggle={() => toggleParam('serviceLife')}
              />
            </div>

            <div className="param-group">
              <h3>制氢系统 (H2)</h3>
              <InputControl
                label="电解水功率 (MW)"
                name="h2Power"
                value={params.h2Power}
                min={1} max={500} step={1}
                onChange={handleParamChange}
                isActive={activeParam === 'h2Power'}
                onToggle={() => toggleParam('h2Power')}
              />
              <InputControl
                label="运行时间 (h/年)"
                name="runTimeYear"
                value={params.runTimeYear}
                min={100} max={8760} step={100}
                onChange={handleParamChange}
                isActive={activeParam === 'runTimeYear'}
                onToggle={() => toggleParam('runTimeYear')}
              />
              <InputControl
                label="制氢投资 (元/kW)"
                name="h2PlantUnitCost"
                value={params.h2PlantUnitCost}
                min={1000} max={5000} step={50}
                onChange={handleParamChange}
                isActive={activeParam === 'h2PlantUnitCost'}
                onToggle={() => toggleParam('h2PlantUnitCost')}
              />
              <InputControl
                label="制氢转换效率"
                name="efficiency"
                value={params.efficiency}
                min={0.5} max={0.9} step={0.01}
                onChange={handleParamChange}
                displayTransform={v => (v * 100).toFixed(0) + '%'}
                isActive={activeParam === 'efficiency'}
                onToggle={() => toggleParam('efficiency')}
              />
              <InputControl
                label="制氢人力成本 (万/年)"
                name="h2LaborCost"
                value={params.h2LaborCost}
                min={0} max={2000} step={10}
                onChange={handleParamChange}
                isActive={activeParam === 'h2LaborCost'}
                onToggle={() => toggleParam('h2LaborCost')}
              />
              <InputControl
                label="制氢运维比例 (Capex)"
                name="h2OpExRatio"
                value={params.h2OpExRatio}
                min={0.03} max={0.15} step={0.01}
                onChange={handleParamChange}
                displayTransform={v => (v * 100).toFixed(0) + '%'}
                isActive={activeParam === 'h2OpExRatio'}
                onToggle={() => toggleParam('h2OpExRatio')}
              />
            </div>

            <div className="param-group">
              <h3>甲烷化系统 (CH4)</h3>
              <InputControl
                label="甲烷化投资 (元/吨/年)"
                name="methanePlantUnitCost"
                value={params.methanePlantUnitCost}
                min={1000} max={10000} step={100}
                onChange={handleParamChange}
                isActive={activeParam === 'methanePlantUnitCost'}
                onToggle={() => toggleParam('methanePlantUnitCost')}
              />
              <InputControl
                label="甲烷化系统运行时间 (h/年)"
                name="methaneRunTimeYear"
                value={params.methaneRunTimeYear}
                min={100} max={8760} step={100}
                onChange={handleParamChange}
                isActive={activeParam === 'methaneRunTimeYear'}
                onToggle={() => toggleParam('methaneRunTimeYear')}
              />
              <InputControl
                label="合成工艺能耗 (kWh/kW_h2)"
                name="methaneEnergyLoss"
                value={params.methaneEnergyLoss}
                min={0} max={0.1} step={0.005}
                onChange={handleParamChange}
                displayTransform={v => (v * 100).toFixed(1) + '%'}
                isActive={activeParam === 'methaneEnergyLoss'}
                onToggle={() => toggleParam('methaneEnergyLoss')}
              />
              <InputControl
                label="甲烷化人力 (万/年)"
                name="methaneLaborCost"
                value={params.methaneLaborCost}
                min={0} max={1000} step={10}
                onChange={handleParamChange}
                isActive={activeParam === 'methaneLaborCost'}
                onToggle={() => toggleParam('methaneLaborCost')}
              />
              <InputControl
                label="合成运维比例 (Capex)"
                name="methaneOpExRatio"
                value={params.methaneOpExRatio}
                min={0.03} max={0.15} step={0.01}
                onChange={handleParamChange}
                displayTransform={v => (v * 100).toFixed(0) + '%'}
                isActive={activeParam === 'methaneOpExRatio'}
                onToggle={() => toggleParam('methaneOpExRatio')}
              />
              <InputControl
                label="CO2单价 (元/吨)"
                name="co2Price"
                value={params.co2Price}
                min={-200} max={500} step={10}
                onChange={handleParamChange}
                isActive={activeParam === 'co2Price'}
                onToggle={() => toggleParam('co2Price')}
              />
            </div>

            <div className="sidebar-actions">
              <button className="btn-secondary btn-reset" onClick={handleReset}>
                ↩ 恢复默认值
              </button>
              <button className="btn-secondary btn-return" onClick={scrollToTop}>
                ⬆ 返回顶部
              </button>
            </div>
          </div>
        </aside>

        <section className="main-content">
          <div className="metrics-grid">
            <div className="card metric-card lcoh">
              <div className="metric-label">LCOH (制氢成本)</div>
              <div className="metric-value">{results.metrics.lcoh}</div>
              <div className="metric-unit">元/kg</div>
              <div className="metric-breakdown">
                <div className="breakdown-row"><span>年产氢量:</span> <span>{results.metrics.annualH2} 吨</span></div>
                <div className="breakdown-row"><span>制氢总投资:</span> <span>{results.metrics.h2TotalCapex} 万元</span></div>
              </div>
            </div>
            <div className="card metric-card methane">
              <div className="metric-label">e-甲烷生产成本</div>
              <div className="metric-value">{results.metrics.eMethaneCost}</div>
              <div className="metric-unit">元/Nm³</div>
              <div className="metric-breakdown">
                <div className="breakdown-row"><span>年产甲烷量:</span> <span>{results.metrics.annualMethane} 吨</span></div>
                <div className="breakdown-row"><span>年产甲烷体积:</span> <span>{results.metrics.annualMethaneVol} 万方</span></div>
                <div className="breakdown-row"><span>年产甲烷能量:</span> <span>{results.metrics.annualMethaneMWh} MWh</span></div>
                <div className="breakdown-row highlight-row">
                  <span>等热值对应甲醇价格:</span> <span>{results.metrics.equivMethanolPrice} 元/吨</span>
                </div>
                <div className="breakdown-row">
                  <span>全厂净效率:</span> <span>{results.metrics.netEfficiency}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="card h2-breakdown">
              <h3>制氢环节成本构成 (万元/年)</h3>
              <div className="breakdown-list">
                {results.breakdown.h2.map(item => (
                  <div key={item.name} className="breakdown-item">
                    <span>{item.name}</span>
                    <span>{item.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card methane-breakdown">
              <h3>甲烷化环节成本构成 (万元/年)</h3>
              <div className="breakdown-list">
                {results.breakdown.methane.map(item => (
                  <div key={item.name} className="breakdown-item">
                    <span>{item.name}</span>
                    <span>{item.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card waterfall-wrapper">
              <WaterfallChart />
            </div>
            <div className="card sensitivity-wrapper">
              <SensitivityChart />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>© 2026 氢基燃料成本分析系统 | 实时动态模型</p>
      </footer>
    </div>
  );
}

function InputControl({ label, name, value, min, max, step, onChange, displayTransform, isActive, onToggle }) {
  return (
    <div className={`input-field ${isActive ? 'active' : ''}`} onClick={onToggle}>
      <div className="input-header">
        <label>{label}</label>
        <div className="input-summary">
          <div className="value-display">
            {displayTransform ? displayTransform(value) : value}
          </div>
          <span className="edit-icon">✎</span>
        </div>
      </div>
      <div className="slider-container" onClick={(e) => e.stopPropagation()}>
        <div className="input-control">
          <input
            type="range"
            id={name}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
