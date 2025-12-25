// ============================================
// TOPOLOGY OBSERVABILITY SYSTEMS
// Code-Path Graph + Health Treemap
// ============================================

// ─────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────

type HealthStatus = 'healthy' | 'degraded' | 'broken';

interface HealthMetrics {
  callCount: number;
  errorCount: number;
  errorRate: number;
  avgLatency: number;
  p99Latency: number;
  lastCall: Date;
  lastError?: Date;
}

function calculateHealthScore(metrics: HealthMetrics): number {
  let score = 100;
  
  // Error rate penalty (0-50 points)
  score -= Math.min(50, metrics.errorRate * 50);
  
  // Latency penalty (0-20 points)
  if (metrics.p99Latency > 1000) score -= 20;
  else if (metrics.p99Latency > 500) score -= 10;
  else if (metrics.p99Latency > 200) score -= 5;
  
  // Staleness penalty (0-10 points)
  const hoursSinceLastCall = (Date.now() - metrics.lastCall.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastCall > 24) score -= 10;
  else if (hoursSinceLastCall > 1) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function healthScoreToColor(score: number): string {
  if (score >= 90) return '#22c55e'; // Deep green
  if (score >= 80) return '#4ade80'; // Light green
  if (score >= 70) return '#84cc16'; // Yellow-green
  if (score >= 60) return '#facc15'; // Yellow
  if (score >= 50) return '#fbbf24'; // Amber
  if (score >= 40) return '#fb923c'; // Orange
  if (score >= 30) return '#f97316'; // Dark orange
  if (score >= 20) return '#ef4444'; // Red
  if (score >= 10) return '#dc2626'; // Dark red
  return '#991b1b'; // Very dark red
}

// ═══════════════════════════════════════════════════════════════════════════
// PART 1: CODE-PATH GRAPH
// ═══════════════════════════════════════════════════════════════════════════

type NodeType = 'entry' | 'function' | 'service' | 'database' | 'external';

interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  metrics: HealthMetrics;
  healthScore: number;
  position?: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  status: HealthStatus;
  metrics: HealthMetrics;
  createdAt: Date;
  isNew: boolean; // Created in last 24h
}

interface GraphState {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  healthyEdges: number;
  degradedEdges: number;
  brokenEdges: number;
  newEdges: number;
  overallHealth: number;
}

class CodePathGraph {
  private state: GraphState = {
    nodes: new Map(),
    edges: new Map(),
    healthyEdges: 0,
    degradedEdges: 0,
    brokenEdges: 0,
    newEdges: 0,
    overallHealth: 100,
  };
  
  private listeners: Map<string, Function[]> = new Map();
  
  // ─────────────────────────────────────────
  // Node Management
  // ─────────────────────────────────────────
  
  addNode(node: Omit<GraphNode, 'healthScore'>): GraphNode {
    const fullNode: GraphNode = {
      ...node,
      healthScore: calculateHealthScore(node.metrics),
    };
    
    this.state.nodes.set(node.id, fullNode);
    this.emit('node:added', fullNode);
    return fullNode;
  }
  
  // ─────────────────────────────────────────
  // Edge Management
  // ─────────────────────────────────────────
  
  addEdge(sourceId: string, targetId: string, metrics: HealthMetrics): GraphEdge | null {
    if (!this.state.nodes.has(sourceId) || !this.state.nodes.has(targetId)) {
      return null;
    }
    
    const id = `${sourceId}->${targetId}`;
    const now = new Date();
    const isNew = true; // Just created
    
    const edge: GraphEdge = {
      id,
      sourceId,
      targetId,
      status: this.classifyEdgeHealth(metrics),
      metrics,
      createdAt: now,
      isNew,
    };
    
    this.state.edges.set(id, edge);
    this.recalculateStats();
    this.emit('edge:added', edge);
    
    return edge;
  }
  
  updateEdgeMetrics(edgeId: string, metrics: Partial<HealthMetrics>): void {
    const edge = this.state.edges.get(edgeId);
    if (!edge) return;
    
    const oldStatus = edge.status;
    edge.metrics = { ...edge.metrics, ...metrics };
    edge.status = this.classifyEdgeHealth(edge.metrics);
    
    // Check if it's still "new" (< 24h old)
    const hoursSinceCreation = (Date.now() - edge.createdAt.getTime()) / (1000 * 60 * 60);
    edge.isNew = hoursSinceCreation < 24;
    
    if (oldStatus !== edge.status) {
      this.recalculateStats();
      this.emit('edge:status_changed', { edge, oldStatus, newStatus: edge.status });
      
      if (edge.status === 'broken') {
        this.emit('edge:broken', edge);
      }
    }
  }
  
  private classifyEdgeHealth(metrics: HealthMetrics): HealthStatus {
    if (metrics.errorRate >= 0.1 || metrics.avgLatency > 5000) {
      return 'broken';
    }
    if (metrics.errorRate >= 0.01 || metrics.avgLatency > 500) {
      return 'degraded';
    }
    return 'healthy';
  }
  
  // ─────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────
  
  private recalculateStats(): void {
    let healthy = 0, degraded = 0, broken = 0, newCount = 0;
    
    for (const edge of this.state.edges.values()) {
      switch (edge.status) {
        case 'healthy': healthy++; break;
        case 'degraded': degraded++; break;
        case 'broken': broken++; break;
      }
      if (edge.isNew) newCount++;
    }
    
    this.state.healthyEdges = healthy;
    this.state.degradedEdges = degraded;
    this.state.brokenEdges = broken;
    this.state.newEdges = newCount;
    
    const total = healthy + degraded + broken;
    this.state.overallHealth = total > 0 
      ? Math.round(((healthy * 1 + degraded * 0.5 + broken * 0) / total) * 100)
      : 100;
  }
  
  getStats(): Omit<GraphState, 'nodes' | 'edges'> & { 
    nodeCount: number; 
    edgeCount: number;
  } {
    return {
      nodeCount: this.state.nodes.size,
      edgeCount: this.state.edges.size,
      healthyEdges: this.state.healthyEdges,
      degradedEdges: this.state.degradedEdges,
      brokenEdges: this.state.brokenEdges,
      newEdges: this.state.newEdges,
      overallHealth: this.state.overallHealth,
    };
  }
  
  // ─────────────────────────────────────────
  // Rendering Helpers
  // ─────────────────────────────────────────
  
  getEdgeRenderParams(edgeId: string): {
    color: string;
    strokeDasharray: string;
    animationDuration: string;
    showBreakMarker: boolean;
  } | null {
    const edge = this.state.edges.get(edgeId);
    if (!edge) return null;
    
    const configs = {
      healthy: { color: '#4ade80', strokeDasharray: 'none', animationDuration: '1s', showBreakMarker: false },
      degraded: { color: '#f59e0b', strokeDasharray: '8 4', animationDuration: '3s', showBreakMarker: false },
      broken: { color: '#ef4444', strokeDasharray: 'none', animationDuration: '0s', showBreakMarker: true },
    };
    
    return configs[edge.status];
  }
  
  // ─────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }
  
  private emit(event: string, data: unknown): void {
    (this.listeners.get(event) || []).forEach(cb => cb(data));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PART 2: HEALTH TREEMAP
// ═══════════════════════════════════════════════════════════════════════════

interface TreemapFunction {
  id: string;
  name: string;
  linesOfCode: number;
  complexity: number;
  metrics: HealthMetrics;
}

interface TreemapModule {
  id: string;
  featureId: string;
  name: string;
  functions: TreemapFunction[];
  totalLOC: number;
  healthScore: number;
  color: string;
}

interface TreemapFeature {
  id: string;
  name: string;
  icon: string;
  modules: TreemapModule[];
  totalLOC: number;
  healthScore: number;
}

interface TreemapCell {
  moduleId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

class HealthTreemap {
  private features: Map<string, TreemapFeature> = new Map();
  private modules: Map<string, TreemapModule> = new Map();
  private layout: TreemapCell[] = [];
  
  // ─────────────────────────────────────────
  // Data Management
  // ─────────────────────────────────────────
  
  addFeature(id: string, name: string, icon: string): TreemapFeature {
    const feature: TreemapFeature = {
      id,
      name,
      icon,
      modules: [],
      totalLOC: 0,
      healthScore: 100,
    };
    
    this.features.set(id, feature);
    return feature;
  }
  
  addModule(
    featureId: string, 
    id: string, 
    name: string, 
    functions: TreemapFunction[]
  ): TreemapModule | null {
    const feature = this.features.get(featureId);
    if (!feature) return null;
    
    const totalLOC = functions.reduce((sum, f) => sum + f.linesOfCode, 0);
    
    // Calculate module health as weighted average of function healths
    let weightedHealth = 0;
    for (const fn of functions) {
      const fnHealth = calculateHealthScore(fn.metrics);
      weightedHealth += fnHealth * fn.linesOfCode;
    }
    const healthScore = totalLOC > 0 ? weightedHealth / totalLOC : 100;
    
    const module: TreemapModule = {
      id,
      featureId,
      name,
      functions,
      totalLOC,
      healthScore,
      color: healthScoreToColor(healthScore),
    };
    
    this.modules.set(id, module);
    feature.modules.push(module);
    
    // Recalculate feature stats
    this.recalculateFeature(featureId);
    
    return module;
  }
  
  private recalculateFeature(featureId: string): void {
    const feature = this.features.get(featureId);
    if (!feature) return;
    
    feature.totalLOC = feature.modules.reduce((sum, m) => sum + m.totalLOC, 0);
    
    if (feature.totalLOC > 0) {
      let weightedHealth = 0;
      for (const module of feature.modules) {
        weightedHealth += module.healthScore * module.totalLOC;
      }
      feature.healthScore = weightedHealth / feature.totalLOC;
    }
  }
  
  // ─────────────────────────────────────────
  // Update Health
  // ─────────────────────────────────────────
  
  updateFunctionMetrics(moduleId: string, functionId: string, metrics: Partial<HealthMetrics>): void {
    const module = this.modules.get(moduleId);
    if (!module) return;
    
    const fn = module.functions.find(f => f.id === functionId);
    if (!fn) return;
    
    fn.metrics = { ...fn.metrics, ...metrics };
    
    // Recalculate module health
    let weightedHealth = 0;
    for (const f of module.functions) {
      const fHealth = calculateHealthScore(f.metrics);
      weightedHealth += fHealth * f.linesOfCode;
    }
    module.healthScore = module.totalLOC > 0 ? weightedHealth / module.totalLOC : 100;
    module.color = healthScoreToColor(module.healthScore);
    
    // Recalculate feature
    this.recalculateFeature(module.featureId);
  }
  
  // ─────────────────────────────────────────
  // Layout Calculation (Simplified Squarify)
  // ─────────────────────────────────────────
  
  calculateLayout(width: number, height: number): TreemapCell[] {
    const allModules = Array.from(this.modules.values())
      .sort((a, b) => b.totalLOC - a.totalLOC);
    
    const totalLOC = allModules.reduce((sum, m) => sum + m.totalLOC, 0);
    if (totalLOC === 0) return [];
    
    const cells: TreemapCell[] = [];
    let currentX = 0;
    let currentY = 0;
    let remainingWidth = width;
    let remainingHeight = height;
    let isHorizontal = width > height;
    
    // Simplified strip layout (not full squarify, but demonstrates the concept)
    for (const module of allModules) {
      const ratio = module.totalLOC / totalLOC;
      
      let cellWidth: number, cellHeight: number;
      
      if (isHorizontal) {
        cellWidth = remainingWidth * ratio * 2; // Adjusted for visual balance
        cellHeight = remainingHeight / 2;
        
        if (currentX + cellWidth > width) {
          currentX = 0;
          currentY += remainingHeight / 2;
        }
      } else {
        cellWidth = remainingWidth / 2;
        cellHeight = remainingHeight * ratio * 2;
        
        if (currentY + cellHeight > height) {
          currentY = 0;
          currentX += remainingWidth / 2;
        }
      }
      
      cells.push({
        moduleId: module.id,
        x: currentX,
        y: currentY,
        width: Math.min(cellWidth, width - currentX),
        height: Math.min(cellHeight, height - currentY),
        color: module.color,
      });
      
      if (isHorizontal) {
        currentX += cellWidth;
      } else {
        currentY += cellHeight;
      }
    }
    
    this.layout = cells;
    return cells;
  }
  
  // ─────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────
  
  getStats(): {
    totalLOC: number;
    featureCount: number;
    moduleCount: number;
    avgHealth: number;
    criticalModules: number;
  } {
    const modules = Array.from(this.modules.values());
    const totalLOC = modules.reduce((sum, m) => sum + m.totalLOC, 0);
    const avgHealth = modules.length > 0
      ? modules.reduce((sum, m) => sum + m.healthScore, 0) / modules.length
      : 100;
    const criticalModules = modules.filter(m => m.healthScore < 30).length;
    
    return {
      totalLOC,
      featureCount: this.features.size,
      moduleCount: this.modules.size,
      avgHealth: Math.round(avgHealth),
      criticalModules,
    };
  }
  
  getModulesByHealth(ascending: boolean = true): TreemapModule[] {
    const modules = Array.from(this.modules.values());
    return modules.sort((a, b) => ascending 
      ? a.healthScore - b.healthScore 
      : b.healthScore - a.healthScore
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLE
// ═══════════════════════════════════════════════════════════════════════════

// --- Code-Path Graph ---
const graph = new CodePathGraph();

// Add nodes
graph.addNode({ 
  id: 'main', 
  name: 'main()', 
  type: 'entry',
  metrics: { callCount: 10000, errorCount: 10, errorRate: 0.001, avgLatency: 50, p99Latency: 120, lastCall: new Date() }
});
graph.addNode({ 
  id: 'auth', 
  name: 'auth()', 
  type: 'function',
  metrics: { callCount: 8000, errorCount: 40, errorRate: 0.005, avgLatency: 80, p99Latency: 200, lastCall: new Date() }
});
graph.addNode({ 
  id: 'cache', 
  name: 'cache', 
  type: 'service',
  metrics: { callCount: 5000, errorCount: 500, errorRate: 0.1, avgLatency: 2000, p99Latency: 5000, lastCall: new Date() }
});

// Add edges
graph.addEdge('main', 'auth', { callCount: 8000, errorCount: 10, errorRate: 0.00125, avgLatency: 30, p99Latency: 80, lastCall: new Date() });
graph.addEdge('auth', 'cache', { callCount: 5000, errorCount: 600, errorRate: 0.12, avgLatency: 3000, p99Latency: 8000, lastCall: new Date() });

// Subscribe to events
graph.on('edge:broken', (edge: GraphEdge) => {
  console.log(`🚨 BROKEN PATH: ${edge.id}`);
});

console.log('Graph Stats:', graph.getStats());

// --- Health Treemap ---
const treemap = new HealthTreemap();

// Add features and modules
treemap.addFeature('auth', 'Authentication', '🔐');
treemap.addModule('auth', 'oauth', 'OAuth2 Provider', [
  { id: 'oauth-init', name: 'initOAuth', linesOfCode: 200, complexity: 5, 
    metrics: { callCount: 1000, errorCount: 5, errorRate: 0.005, avgLatency: 50, p99Latency: 100, lastCall: new Date() }},
  { id: 'oauth-callback', name: 'handleCallback', linesOfCode: 350, complexity: 8,
    metrics: { callCount: 800, errorCount: 10, errorRate: 0.0125, avgLatency: 80, p99Latency: 200, lastCall: new Date() }},
]);

treemap.addFeature('payments', 'Payments', '💳');
treemap.addModule('payments', 'refunds', 'Refunds', [
  { id: 'refund-process', name: 'processRefund', linesOfCode: 400, complexity: 12,
    metrics: { callCount: 200, errorCount: 80, errorRate: 0.4, avgLatency: 2000, p99Latency: 8000, lastCall: new Date() }},
  { id: 'refund-validate', name: 'validateAmount', linesOfCode: 150, complexity: 6,
    metrics: { callCount: 200, errorCount: 36, errorRate: 0.18, avgLatency: 100, p99Latency: 300, lastCall: new Date() }},
]);

console.log('Treemap Stats:', treemap.getStats());
console.log('Unhealthiest modules:', treemap.getModulesByHealth(true).slice(0, 3).map(m => `${m.name}: ${m.healthScore.toFixed(0)}%`));

export { 
  CodePathGraph, 
  HealthTreemap, 
  GraphNode, 
  GraphEdge, 
  TreemapModule, 
  TreemapFeature,
  calculateHealthScore,
  healthScoreToColor 
};
