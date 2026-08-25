import OpenAI from 'openai';
import { config } from '../config';
import { QueryIntent, QueryIntentType } from '../../types/agent';

// Lazy initialization to avoid crashes during build when credentials are missing
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.groq.apiKey || 'dummy-key-for-build',
      baseURL: config.groq.baseURL,
    });
  }
  return openaiClient;
}

export async function classifyIntent(query: string): Promise<QueryIntent> {
  try {
    if (!config.groq.apiKey) {
      return fallbackIntentClassification(query);
    }

    const openai = getOpenAIClient();
    const systemPrompt = 'You are an intent classifier. Classify queries into: pipeline_query, work_order_query, cross_board_comparison, leadership_update, or sector_analysis. Return JSON with: type, requiredDatasets (array), filters (object), analysisType, confidence.';
    
    const response = await openai.chat.completions.create({
      model: config.groq.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      type: result.type as QueryIntentType,
      requiredDatasets: result.requiredDatasets || ['deals'],
      filters: result.filters || {},
      analysisType: result.analysisType || 'summary',
      confidence: result.confidence || 0.8,
    };
  } catch (error) {
    console.error('Intent classification error:', error);
    return fallbackIntentClassification(query);
  }
}

function fallbackIntentClassification(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();
  const sectorMatch = query.match(/\b(energy|healthcare|technology|finance|manufacturing|retail|government|education)\b/i);
  if (sectorMatch) {
    const sector = sectorMatch[0].charAt(0).toUpperCase() + sectorMatch[0].slice(1).toLowerCase();
    return { type: 'sector_analysis', requiredDatasets: ['deals'], filters: { sectors: [sector] }, analysisType: 'summary', confidence: 0.85 };
  }
  
  if (lowerQuery.includes('leadership') || lowerQuery.includes('executive') || lowerQuery.includes('update')) {
    return { type: 'leadership_update', requiredDatasets: ['deals', 'work_orders'], filters: {}, analysisType: 'summary', confidence: 0.7 };
  }
  if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) {
    return { type: 'cross_board_comparison', requiredDatasets: ['deals', 'work_orders'], filters: {}, analysisType: 'comparison', confidence: 0.7 };
  }
  if (lowerQuery.includes('work order') || lowerQuery.includes('project')) {
    return { type: 'work_order_query', requiredDatasets: ['work_orders'], filters: {}, analysisType: 'summary', confidence: 0.7 };
  }
  return { type: 'pipeline_query', requiredDatasets: ['deals'], filters: {}, analysisType: 'summary', confidence: 0.6 };
}

export async function explainMetrics(query: string, metrics: any, dataQuality?: any): Promise<string> {
  // Calculated metrics are the source of truth. Return a concise report directly
  // so a temporary AI-provider outage never prevents the user getting an answer.
  if (query) return createShortReport(metrics, dataQuality);
  try {
    if (!config.groq.apiKey) {
      return createShortReport(metrics, dataQuality);
    }

    const openai = getOpenAIClient();
    let summary = 'Based on your Monday.com data:\n\n';
    
    if (metrics.dealCount !== undefined) {
      summary += '📊 Pipeline Overview:\n';
      summary += '- Total Deals: ' + metrics.dealCount + '\n';
      summary += '- Total Value: $' + (metrics.totalValue || 0).toLocaleString() + '\n';
      summary += '- Weighted Value: $' + (metrics.weightedValue || 0).toLocaleString() + '\n';
      summary += '- Conversion Rate: ' + ((metrics.conversionRate || 0) * 100).toFixed(1) + '%\n\n';
    }
    
    if (metrics.projectCount !== undefined) {
      summary += '🚀 Work Orders:\n';
      summary += '- Total Projects: ' + metrics.projectCount + '\n';
      summary += '- Total Value: $' + (metrics.totalValue || 0).toLocaleString() + '\n';
      summary += '- Completion Rate: ' + ((metrics.completionRate || 0) * 100).toFixed(1) + '%\n\n';
    }
    
    if (dataQuality && dataQuality.successRate < 0.9) {
      summary += '\n⚠️ Note: ' + ((1 - dataQuality.successRate) * 100).toFixed(0) + '% of records have data quality issues.\n';
    }

    const systemPrompt = 'You are a business analyst. Provide a brief, executive-level summary of the metrics. Focus on key insights and actionable recommendations. Be concise.';
    const userPrompt = 'Query: "' + query + '"\n\nData summary:\n' + summary + '\n\nProvide analysis:';

    const response = await openai.chat.completions.create({
      model: config.groq.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content || '';
    return summary + '\n' + aiResponse;
    
  } catch (error: any) {
    console.error('Explanation generation error:', error);
    console.error('Error details:', error.message);
    
    let fallback = 'Executive brief:\n\n';
    
    if (metrics.dealCount !== undefined) {
      fallback += 'Pipeline: ' + metrics.dealCount + ' opportunities worth $' + (metrics.totalValue || 0).toLocaleString() + '.\n\n';
      fallback += 'Outlook: weighted pipeline is $' + (metrics.weightedValue || 0).toLocaleString() + ' with a ' + ((metrics.conversionRate || 0) * 100).toFixed(1) + '% conversion rate.\n\n';
    }
    
    if (metrics.projectCount !== undefined) {
      fallback += 'Operations: ' + metrics.projectCount + ' work orders worth $' + (metrics.totalValue || 0).toLocaleString() + ', with ' + ((metrics.completionRate || 0) * 100).toFixed(1) + '% completed.\n\n';
    }
    
    if (dataQuality && dataQuality.successRate < 0.9) {
      fallback += '\nData quality: ' + (dataQuality.successRate * 100).toFixed(0) + '% complete\n';
    }
    
    return fallback;
  }
}

function createShortReport(metrics: any, dataQuality?: any): string {
  const pipeline = metrics.pipeline ?? metrics;
  const workOrders = metrics.workOrders;
  const formatMoney = (amount: unknown) => typeof amount === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(amount)
    : 'not available';
  const formatPercent = (amount: unknown) => typeof amount === 'number' ? `${Math.round(amount * 100)}%` : 'not available';
  const report: string[] = [];

  if (typeof pipeline.totalValue === 'number') {
    report.push(`Pipeline: ${formatMoney(pipeline.totalValue)} across ${pipeline.dealCount ?? 0} opportunities.`);
  }
  if (typeof pipeline.weightedValue === 'number') {
    report.push(`Outlook: ${formatMoney(pipeline.weightedValue)} weighted pipeline with a ${formatPercent(pipeline.conversionRate)} conversion rate.`);
  }
  if (pipeline.bySector && typeof pipeline.bySector === 'object') {
    const leader = Object.values(pipeline.bySector as Record<string, { sector?: string; totalValue?: number }>).sort((a, b) => (b.totalValue ?? 0) - (a.totalValue ?? 0))[0];
    if (leader) report.push(`Sector leader: ${leader.sector ?? 'Unknown'} at ${formatMoney(leader.totalValue)}.`);
  }
  if (workOrders) {
    report.push(`Operations: ${workOrders.projectCount ?? 0} work orders valued at ${formatMoney(workOrders.totalValue)}, with ${formatPercent(workOrders.completionRate)} completed.`);
  }
  if (pipeline.sectorMetrics) {
    report.push(`${pipeline.sectorMetrics.sector}: ${formatMoney(pipeline.sectorMetrics.totalValue)} across ${pipeline.sectorMetrics.count ?? 0} opportunities.`);
  }
  if (dataQuality?.successRate !== undefined && dataQuality.successRate < 0.9) {
    report.push(`Data quality note: ${Math.round(dataQuality.successRate * 100)}% of records were processed.`);
  }
  return report.length ? report.join('\n\n') : 'No matching records were found for this question.';
}
