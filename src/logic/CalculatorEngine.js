/**
 * 氢基燃料成本计算引擎
 * 基于 Excel 文件中的公式实现
 */
export class CalculatorEngine {
    constructor(params) {
        // 默认参数 (根据 Excel 识别并根据用户反馈调整)
        this.params = {
            wacc: 0.04,                // B21: 折现率WACC
            serviceLife: 20,           // B22: 寿命 (年)
            h2Power: 100,              // B25: 电解水功率 (MW)
            runTimeYear: 4000,         // B26: 电解槽运行/年 (h)
            methaneEnergyLoss: 0.025,  // B27: 甲烷化工艺能耗 (kWh/kW_h2) -> 指制氢功率的百分比能耗
            efficiency: 0.65,          // B28: 转换效率 (H2/Elec)
            h2PlantUnitCost: 2100,     // B37: 制氢厂投资单价 (元/kW)
            h2OpExRatio: 0.05,         // B40: 制氢运维占比CAPEX
            h2LaborCost: 600,          // B42: 制氢人工 (万元/年)
            electricityPrice: 0.1,     // B43: 制氢电力单价 (元/kWh)
            methanePlantUnitCost: 2750,// B51: 甲烷化工厂投资单价 (元/吨/年甲烷产能)
            methaneOpExRatio: 0.04,    // B54: 甲烷化运维占比CAPEX
            methaneLaborCost: 250,     // B56: 甲烷化人工 (万元/年)
            synthesisElecPrice: 0.1,   // B57: 合成用电单价 (元/kWh)
            co2Price: 0,               // B60: CO2单价 (元/吨)
            methaneRunTimeYear: 4000,  // D52: 甲烷化系统运行时长 (h)
            ...params
        };
    }

    calculate() {
        const p = this.params;

        // 1. 年金因子 (B23)
        const annuityFactor = (Math.pow(1 + p.wacc, p.serviceLife) * p.wacc) / (Math.pow(1 + p.wacc, p.serviceLife) - 1);

        // 2. 制氢环节计算
        // 年产氢量 (B29): 功率(MW) * 运行时长(h) * 1000(k) * 转换效率 / 33.3(热值) / 1000(吨)
        const annualH2Production = (p.h2Power * p.runTimeYear * 1000 * p.efficiency) / 33.3 / 1000;

        // 制氢总投资 (B38): 单价 * 功率 * 1000 / 10000 (万元)
        const h2TotalCapex = (p.h2PlantUnitCost * p.h2Power * 1000) / 10000;

        // 制氢系统年化投资 (B39)
        const h2AnnualizedCapex = h2TotalCapex * annuityFactor;

        // 制氢运维 (B41)
        const h2AnnualOpEx = p.h2OpExRatio * h2TotalCapex;

        // 电力年用量 (B44) (万kWh)
        const annualElectricityUsage = (p.h2Power * p.runTimeYear * 1000) / 10000;

        // 制氢电力年成本 (B45) (万元)
        const annualElectricityCost = annualElectricityUsage * p.electricityPrice;

        // 制氢总成本/年 (B46)
        const h2TotalAnnualCost = h2AnnualizedCapex + h2AnnualOpEx + annualElectricityCost + p.h2LaborCost;

        // 单位制氢成本 (B47) (元/kg)
        const lcoh = (h2TotalAnnualCost / annualH2Production) * 10000 / 1000;

        // 3. 甲烷化环节计算
        // 年产甲烷量 (B30) (吨): H2产量 * 16 / 8 (化学键比例)
        const annualMethaneProduction = annualH2Production * (16 / 8);
        // 万方/年 (B31)
        const annualMethaneVol = (annualMethaneProduction * 1400) / 10000;
        // 兆瓦时/年 (B32)
        const annualMethaneMWh = annualMethaneProduction * 13.9;

        // 甲烷化全厂总投资 (B52) (万元)
        // 根据反馈，单位是 元/吨/年甲烷产能力（标况 8000 小时/年计算）
        // 实际总投资 = (单价 * 年产量 / 10000) * (8000 / 甲烷化系统实际运行时长D52)
        const methaneTotalCapex = (p.methanePlantUnitCost * annualMethaneProduction) / 10000 * (8000 / p.methaneRunTimeYear);

        // 甲烷化系统年化投资 (B53)
        const methaneAnnualizedCapex = methaneTotalCapex * annuityFactor;

        // 甲烷化运维 (B55)
        const methaneAnnualOpEx = p.methaneOpExRatio * methaneTotalCapex;

        // 合成用电量 (B58=B33) (MWh): 能耗(B27) * 功率(MW) * 时间(h)
        const synthesisElecUsageMWh = p.methaneEnergyLoss * p.h2Power * p.runTimeYear;

        // 合成年用电成本 (B59) (万元): MWh * 用电单价 * 1000(kWh) / 10000(万)
        const synthesisElecCost = synthesisElecUsageMWh * p.synthesisElecPrice * 0.1;

        // CO2年用量 (B61): 44/8 * H2产生量
        const annualCO2Usage = (44 / 8) * annualH2Production;

        // CO2年成本 (B62)
        const annualCO2Cost = (annualCO2Usage * p.co2Price) / 10000;

        // H2年成本 (B65) (万元)
        const annualH2CostInput = (lcoh * 1000 * annualH2Production) / 10000;

        // 甲烷年总成本 (B66)
        const methaneTotalAnnualCost = methaneAnnualizedCapex + methaneAnnualOpEx + p.methaneLaborCost + synthesisElecCost + (annualCO2Cost || 0) + annualH2CostInput;

        // e-甲烷成本 (B3) (元/方): 总成本 / (年产量(吨) * 1400) * 10000 
        // 或者用 万方计算: (总成本(万元)/年产万方)
        const eMethaneCostPerM3 = annualMethaneVol > 0 ? (methaneTotalAnnualCost / annualMethaneVol) : 0;

        // 净效率 (B35): 产出热值(MWh) / (输入制氢电力(MWh) + 合成能耗(MWh))
        const totalInputMWh = (p.h2Power * p.runTimeYear) + synthesisElecUsageMWh;
        const netEfficiency = annualMethaneMWh / (totalInputMWh || 1);

        // 等热值对应甲醇价格 (元/吨): (e-甲烷生产成本 / 10 * 5560)
        const equivMethanolPrice = (eMethaneCostPerM3 / 10) * 5560;

        return {
            metrics: {
                lcoh: lcoh.toFixed(2),
                eMethaneCost: eMethaneCostPerM3.toFixed(2),
                equivMethanolPrice: equivMethanolPrice.toFixed(1),
                annualH2: annualH2Production.toFixed(0),
                annualMethane: annualMethaneProduction.toFixed(0),
                annualMethaneVol: annualMethaneVol.toFixed(1),
                annualMethaneMWh: annualMethaneMWh.toFixed(0),
                h2TotalCapex: h2TotalCapex.toFixed(0),
                methaneTotalCapex: methaneTotalCapex.toFixed(0),
                netEfficiency: (netEfficiency * 100).toFixed(1)
            },
            breakdown: {
                h2: [
                    { name: '制氢系统年化投资', value: h2AnnualizedCapex },
                    { name: '运维成本', value: h2AnnualOpEx },
                    { name: '电解电力成本', value: annualElectricityCost },
                    { name: '人工成本', value: p.h2LaborCost },
                ],
                methane: [
                    { name: '甲烷化系统年化投资', value: methaneAnnualizedCapex },
                    { name: '运维成本', value: methaneAnnualOpEx },
                    { name: '人工成本', value: p.methaneLaborCost },
                    { name: '合成用电成本', value: synthesisElecCost },
                    { name: 'CO2成本', value: (annualCO2Cost || 0) },
                    { name: '氢气原料成本', value: annualH2CostInput },
                ]
            }
        };
    }
}
