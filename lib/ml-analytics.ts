/**
 * ML Analytics Utilities
 * Provides machine learning-based predictions and insights for event analytics
 */

export interface TimeSeriesData {
  date: string
  value: number
}

export interface PredictionResult {
  date: string
  actual?: number
  predicted: number
  confidence: {
    lower: number
    upper: number
  }
}

export interface TrendAnalysis {
  trend: 'upward' | 'downward' | 'stable'
  strength: number // 0-1
  changeRate: number
  forecast: number
}

export interface AnomalyDetection {
  isAnomaly: boolean
  score: number
  expectedRange: { min: number; max: number }
}

/**
 * Linear Regression for trend prediction
 */
export function linearRegression(data: TimeSeriesData[]): { slope: number; intercept: number } {
  const n = data.length
  if (n === 0) return { slope: 0, intercept: 0 }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  data.forEach((point, index) => {
    const x = index
    const y = point.value
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

/**
 * Exponential Moving Average for smoothing
 */
export function exponentialMovingAverage(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return []
  
  const ema: number[] = [data[0]]
  
  for (let i = 1; i < data.length; i++) {
    ema.push(alpha * data[i] + (1 - alpha) * ema[i - 1])
  }
  
  return ema
}

/**
 * Predict future values using linear regression
 */
export function predictFutureValues(
  historicalData: TimeSeriesData[],
  periodsAhead: number
): PredictionResult[] {
  const { slope, intercept } = linearRegression(historicalData)
  const predictions: PredictionResult[] = []
  
  // Calculate standard deviation for confidence intervals
  const values = historicalData.map(d => d.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  const startIndex = historicalData.length
  
  for (let i = 0; i < periodsAhead; i++) {
    const x = startIndex + i
    const predicted = slope * x + intercept
    
    // Confidence interval (95% = ~1.96 * stdDev)
    const confidenceMargin = 1.96 * stdDev * Math.sqrt(1 + 1 / historicalData.length)
    
    predictions.push({
      date: `Forecast +${i + 1}`,
      predicted: Math.max(0, Math.round(predicted)),
      confidence: {
        lower: Math.max(0, Math.round(predicted - confidenceMargin)),
        upper: Math.round(predicted + confidenceMargin)
      }
    })
  }
  
  return predictions
}

/**
 * Analyze trend direction and strength
 */
export function analyzeTrend(data: TimeSeriesData[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      trend: 'stable',
      strength: 0,
      changeRate: 0,
      forecast: data[0]?.value || 0
    }
  }
  
  const { slope, intercept } = linearRegression(data)
  const values = data.map(d => d.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  
  // Calculate R-squared for trend strength
  const yPredicted = data.map((_, i) => slope * i + intercept)
  const ssRes = data.reduce((sum, point, i) => sum + Math.pow(point.value - yPredicted[i], 2), 0)
  const ssTot = data.reduce((sum, point) => sum + Math.pow(point.value - mean, 2), 0)
  const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot)
  
  // Determine trend direction
  const changeRate = (slope / mean) * 100
  let trend: 'upward' | 'downward' | 'stable' = 'stable'
  
  if (Math.abs(changeRate) > 2) {
    trend = slope > 0 ? 'upward' : 'downward'
  }
  
  // Forecast next value
  const forecast = slope * data.length + intercept
  
  return {
    trend,
    strength: Math.abs(rSquared),
    changeRate,
    forecast: Math.max(0, Math.round(forecast))
  }
}

/**
 * Detect anomalies using statistical methods (Z-score)
 */
export function detectAnomaly(value: number, historicalData: number[], threshold: number = 2.5): AnomalyDetection {
  if (historicalData.length < 3) {
    return {
      isAnomaly: false,
      score: 0,
      expectedRange: { min: value, max: value }
    }
  }
  
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length
  const stdDev = Math.sqrt(variance)
  
  const zScore = stdDev === 0 ? 0 : Math.abs((value - mean) / stdDev)
  
  return {
    isAnomaly: zScore > threshold,
    score: zScore,
    expectedRange: {
      min: Math.max(0, Math.round(mean - threshold * stdDev)),
      max: Math.round(mean + threshold * stdDev)
    }
  }
}

/**
 * Calculate growth rate between periods
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Seasonal decomposition (simple moving average)
 */
export function seasonalDecomposition(data: number[], period: number = 7): {
  trend: number[]
  seasonal: number[]
  residual: number[]
} {
  const n = data.length
  const trend: number[] = []
  
  // Calculate trend using moving average
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - Math.floor(period / 2))
    const end = Math.min(n, i + Math.ceil(period / 2))
    const window = data.slice(start, end)
    trend.push(window.reduce((a, b) => a + b, 0) / window.length)
  }
  
  // Calculate seasonal component
  const detrended = data.map((val, i) => val - trend[i])
  const seasonal: number[] = []
  
  for (let i = 0; i < n; i++) {
    const seasonalIndex = i % period
    const seasonalValues = detrended.filter((_, idx) => idx % period === seasonalIndex)
    seasonal.push(seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length)
  }
  
  // Calculate residual
  const residual = data.map((val, i) => val - trend[i] - seasonal[i])
  
  return { trend, seasonal, residual }
}

/**
 * Calculate correlation between two datasets
 */
export function calculateCorrelation(data1: number[], data2: number[]): number {
  if (data1.length !== data2.length || data1.length === 0) return 0
  
  const n = data1.length
  const mean1 = data1.reduce((a, b) => a + b, 0) / n
  const mean2 = data2.reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let sum1Sq = 0
  let sum2Sq = 0
  
  for (let i = 0; i < n; i++) {
    const diff1 = data1[i] - mean1
    const diff2 = data2[i] - mean2
    numerator += diff1 * diff2
    sum1Sq += diff1 * diff1
    sum2Sq += diff2 * diff2
  }
  
  const denominator = Math.sqrt(sum1Sq * sum2Sq)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Generate synthetic data for extended predictions
 */
export function generateExtendedForecast(
  historicalData: TimeSeriesData[],
  periods: number
): PredictionResult[] {
  const predictions = predictFutureValues(historicalData, periods)
  const trendAnalysis = analyzeTrend(historicalData)
  
  // Adjust predictions based on trend strength
  return predictions.map((pred, index) => {
    const adjustmentFactor = 1 + (trendAnalysis.strength * 0.1 * (index + 1))
    const adjusted = pred.predicted * adjustmentFactor
    
    return {
      ...pred,
      predicted: Math.round(adjusted),
      confidence: {
        lower: Math.round(pred.confidence.lower * adjustmentFactor * 0.9),
        upper: Math.round(pred.confidence.upper * adjustmentFactor * 1.1)
      }
    }
  })
}

/**
 * Calculate conversion funnel optimization suggestions
 */
export function optimizeFunnel(funnelData: { stage: string; count: number; rate: number }[]): {
  stage: string
  currentRate: number
  potentialRate: number
  impact: number
}[] {
  return funnelData.map((stage, index) => {
    // Industry benchmarks (simplified)
    const benchmarks: Record<string, number> = {
      'views_to_registrations': 12,
      'registrations_to_attendance': 85,
      'attendance_to_certificates': 90
    }
    
    const benchmarkRate = benchmarks[stage.stage] || stage.rate
    const gap = benchmarkRate - stage.rate
    const impact = index === 0 ? gap : gap * (funnelData[index - 1]?.count || 0) / 100
    
    return {
      stage: stage.stage,
      currentRate: stage.rate,
      potentialRate: benchmarkRate,
      impact: Math.max(0, Math.round(impact))
    }
  })
}
