// ============================================
// MULTI-AGENT RING MONITORING SYSTEM
// Extended System Clock with Impediment Tracking
// ============================================

// ─────────────────────────────────────────────
// LAYER 1: Impediment Types
// ─────────────────────────────────────────────

type ImpedimentCategory = 'blocking' | 'throttling' | 'friction';

interface ImpedimentType {
  id: string;
  category: ImpedimentCategory;
  name: string;
  icon: string;
  defaultImpact: number;      // 0-1: how much it reduces velocity
  requiresHuman: boolean;     // Does resolution need human action?
  autoResolves: boolean;      // Can it resolve on its own?
  avgResolutionTime: number;  // Expected seconds to resolve
}

const IMPEDIMENT_TYPES: Record<string, ImpedimentType> = {
  // BLOCKING (impact = 1.0, ring stops)
  'human_input': {
    id: 'human_input', category: 'blocking', name: 'Waiting for Human Input',
    icon: '⏳', defaultImpact: 1.0, requiresHuman: true, autoResolves: false, avgResolutionTime: 3600
  },
  'approval_gate': {
    id: 'approval_gate', category: 'blocking', name: 'Approval Gate',
    icon: '🔐', defaultImpact: 1.0, requiresHuman: true, autoResolves: false, avgResolutionTime: 7200
  },
  'clarification': {
    id: 'clarification', category: 'blocking', name: 'Clarification Required',
    icon: '❓', defaultImpact: 1.0, requiresHuman: true, autoResolves: false, avgResolutionTime: 1800
  },
  'dependency': {
    id: 'dependency', category: 'blocking', name: 'Unresolved Dependency',
    icon: '🔗', defaultImpact: 1.0, requiresHuman: false, autoResolves: true, avgResolutionTime: 900
  },

  // THROTTLING (impact = 0.3-0.8, ring slows)
  'rate_limit': {
    id: 'rate_limit', category: 'throttling', name: 'API Rate Limit',
    icon: '⚡', defaultImpact: 0.75, requiresHuman: false, autoResolves: true, avgResolutionTime: 300
  },
  'token_limit': {
    id: 'token_limit', category: 'throttling', name: 'Token/Context Limit',
    icon: '🧠', defaultImpact: 0.5, requiresHuman: false, autoResolves: true, avgResolutionTime: 60
  },
  'resource_contention': {
    id: 'resource_contention', category: 'throttling', name: 'Resource Contention',
    icon: '📊', defaultImpact: 0.4, requiresHuman: false, autoResolves: true, avgResolutionTime: 120
  },
  'retry_loop': {
    id: 'retry_loop', category: 'throttling', name: 'Retry/Backoff Loop',
    icon: '🔄', defaultImpact: 0.6, requiresHuman: false, autoResolves: true, avgResolutionTime: 180
  },

  // FRICTION (impact = 0.1-0.3, ring stutters)
  'context_switch': {
    id: 'context_switch', category: 'friction', name: 'Context Switch Overhead',
    icon: '🔀', defaultImpact: 0.15, requiresHuman: false, autoResolves: true, avgResolutionTime: 30
  },
  'complexity_spike': {
    id: 'complexity_spike', category: 'friction', name: 'Complexity Spike',
    icon: '📈', defaultImpact: 0.25, requiresHuman: false, autoResolves: true, avgResolutionTime: 300
  },
  'sequential_bottleneck': {
    id: 'sequential_bottleneck', category: 'friction', name: 'Sequential Bottleneck',
    icon: '📦', defaultImpact: 0.2, requiresHuman: false, autoResolves: false, avgResolutionTime: 600
  },
  'validation_overhead': {
    id: 'validation_overhead', category: 'friction', name: 'Validation Overhead',
    icon: '🔍', defaultImpact: 0.1, requiresHuman: false, autoResolves: true, avgResolutionTime: 60
  },
};

// ─────────────────────────────────────────────
// LAYER 2: Impediment Instance
// ─────────────────────────────────────────────

interface Impediment {
  id: string;
  typeId: string;
  agentId: string;
  startedAt: Date;
  resolvedAt?: Date;
  impact: number;            // Actual impact (may differ from default)
  metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// LAYER 3: Agent & Ring State
// ─────────────────────────────────────────────

type RingStatus = 'optimal' | 'throttled' | 'blocked';

interface RingState {
  speedMultiplier: number;   // Current speed (0-1 of base_rate)
  status: RingStatus;
  impedanceFactor: number;   // Total impedance (0-1)
  rotationDuration: number;  // CSS animation duration in seconds
  lastUpdated: Date;
}

interface Agent {
  id: string;
  name: string;
  type: 'coder' | 'tester' | 'reviewer' | 'orchestrator';
  baseRate: number;          // Max productivity rate (e.g., 20x)
  currentVelocity: number;   // Actual velocity after impedance
  ringState: RingState;
  activeImpediments: Impediment[];
  currentTask?: string;
  progress: number;          // 0-100
}

// ─────────────────────────────────────────────
// LAYER 4: System Metrics
// ─────────────────────────────────────────────

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  blockedAgents: number;
  throttledAgents: number;
  
  theoreticalMaxVelocity: number;  // Sum of all base rates
  currentVelocity: number;         // Sum of actual velocities
  systemVelocityPercent: number;   // current / max * 100
  
  totalEffortRemaining: number;    // In human-hours
  etaAI: number;                   // Hours at current AI velocity
  etaHuman: number;                // Hours at human velocity
  
  lossToBlocking: number;          // Percentage lost
  lossToThrottling: number;
  lossToFriction: number;
  
  activeImpediments: Impediment[];
}

// ─────────────────────────────────────────────
// LAYER 5: Ring Monitor (Core Engine)
// ─────────────────────────────────────────────

class RingMonitor {
  private agents: Map<string, Agent> = new Map();
  private impediments: Map<string, Impediment> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  
  // ─────────────────────────────────────────
  // Agent Management
  // ─────────────────────────────────────────
  
  registerAgent(agent: Omit<Agent, 'ringState' | 'activeImpediments' | 'currentVelocity'>): Agent {
    const fullAgent: Agent = {
      ...agent,
      currentVelocity: agent.baseRate,
      activeImpediments: [],
      ringState: {
        speedMultiplier: 1.0,
        status: 'optimal',
        impedanceFactor: 0,
        rotationDuration: this.calculateRotationDuration(agent.baseRate, 0),
        lastUpdated: new Date(),
      },
    };
    
    this.agents.set(agent.id, fullAgent);
    this.emit('agent:registered', fullAgent);
    return fullAgent;
  }
  
  // ─────────────────────────────────────────
  // Impediment Management
  // ─────────────────────────────────────────
  
  addImpediment(agentId: string, typeId: string, metadata: Record<string, unknown> = {}): Impediment | null {
    const agent = this.agents.get(agentId);
    const type = IMPEDIMENT_TYPES[typeId];
    
    if (!agent || !type) return null;
    
    const impediment: Impediment = {
      id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      typeId,
      agentId,
      startedAt: new Date(),
      impact: type.defaultImpact,
      metadata,
    };
    
    this.impediments.set(impediment.id, impediment);
    agent.activeImpediments.push(impediment);
    
    this.recalculateAgentVelocity(agentId);
    this.emit('impediment:added', impediment);
    
    return impediment;
  }
  
  resolveImpediment(impedimentId: string): boolean {
    const impediment = this.impediments.get(impedimentId);
    if (!impediment) return false;
    
    impediment.resolvedAt = new Date();
    
    const agent = this.agents.get(impediment.agentId);
    if (agent) {
      agent.activeImpediments = agent.activeImpediments.filter(i => i.id !== impedimentId);
      this.recalculateAgentVelocity(impediment.agentId);
    }
    
    this.emit('impediment:resolved', impediment);
    return true;
  }
  
  // ─────────────────────────────────────────
  // Velocity Calculation
  // ─────────────────────────────────────────
  
  private recalculateAgentVelocity(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // Sum all impedance factors (clamped to 0-1)
    const totalImpedance = Math.min(1, agent.activeImpediments.reduce((sum, imp) => sum + imp.impact, 0));
    
    // Calculate new velocity
    const speedMultiplier = 1 - totalImpedance;
    agent.currentVelocity = agent.baseRate * speedMultiplier;
    
    // Determine status
    let status: RingStatus = 'optimal';
    if (totalImpedance >= 1) {
      status = 'blocked';
    } else if (totalImpedance > 0.2) {
      status = 'throttled';
    }
    
    // Update ring state
    agent.ringState = {
      speedMultiplier,
      status,
      impedanceFactor: totalImpedance,
      rotationDuration: this.calculateRotationDuration(agent.baseRate, totalImpedance),
      lastUpdated: new Date(),
    };
    
    this.emit('agent:velocity_changed', agent);
  }
  
  private calculateRotationDuration(baseRate: number, impedance: number): number {
    // Base duration inversely proportional to rate
    // 20x rate = 1.5s per rotation at optimal
    const baseDuration = 30 / baseRate;
    
    if (impedance >= 1) {
      return Infinity; // Ring stopped
    }
    
    // Slower rotation with higher impedance
    return baseDuration / (1 - impedance);
  }
  
  // ─────────────────────────────────────────
  // System Metrics
  // ─────────────────────────────────────────
  
  getSystemMetrics(totalEffortRemaining: number = 100): SystemMetrics {
    const agents = Array.from(this.agents.values());
    
    const totalAgents = agents.length;
    const blockedAgents = agents.filter(a => a.ringState.status === 'blocked').length;
    const throttledAgents = agents.filter(a => a.ringState.status === 'throttled').length;
    const activeAgents = totalAgents - blockedAgents;
    
    const theoreticalMaxVelocity = agents.reduce((sum, a) => sum + a.baseRate, 0);
    const currentVelocity = agents.reduce((sum, a) => sum + a.currentVelocity, 0);
    const systemVelocityPercent = theoreticalMaxVelocity > 0 
      ? (currentVelocity / theoreticalMaxVelocity) * 100 
      : 0;
    
    // Calculate loss breakdown
    let lossToBlocking = 0;
    let lossToThrottling = 0;
    let lossToFriction = 0;
    
    for (const agent of agents) {
      for (const imp of agent.activeImpediments) {
        const type = IMPEDIMENT_TYPES[imp.typeId];
        if (type) {
          const impactPercent = (imp.impact / theoreticalMaxVelocity) * agent.baseRate * 100;
          switch (type.category) {
            case 'blocking': lossToBlocking += impactPercent; break;
            case 'throttling': lossToThrottling += impactPercent; break;
            case 'friction': lossToFriction += impactPercent; break;
          }
        }
      }
    }
    
    // ETA calculations
    const etaAI = currentVelocity > 0 ? totalEffortRemaining / currentVelocity : Infinity;
    const etaHuman = totalEffortRemaining; // Human rate = 1x
    
    return {
      totalAgents,
      activeAgents,
      blockedAgents,
      throttledAgents,
      theoreticalMaxVelocity,
      currentVelocity,
      systemVelocityPercent,
      totalEffortRemaining,
      etaAI,
      etaHuman,
      lossToBlocking,
      lossToThrottling,
      lossToFriction,
      activeImpediments: Array.from(this.impediments.values()).filter(i => !i.resolvedAt),
    };
  }
  
  // ─────────────────────────────────────────
  // Ring Animation Parameters (for UI)
  // ─────────────────────────────────────────
  
  getRingParameters(agentId: string): {
    duration: string;
    color: string;
    opacity: number;
    strokeDasharray: string;
    animationPlayState: string;
  } | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    const { ringState } = agent;
    
    const colorMap: Record<RingStatus, string> = {
      optimal: '#4ade80',
      throttled: '#f59e0b',
      blocked: '#ef4444',
    };
    
    return {
      duration: ringState.status === 'blocked' ? '0s' : `${ringState.rotationDuration}s`,
      color: colorMap[ringState.status],
      opacity: ringState.status === 'blocked' ? 0.4 : 0.7 + (ringState.speedMultiplier * 0.3),
      strokeDasharray: '40 15',
      animationPlayState: ringState.status === 'blocked' ? 'paused' : 'running',
    };
  }
  
  // ─────────────────────────────────────────
  // Event System
  // ─────────────────────────────────────────
  
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(cb => cb(data));
  }
  
  // ─────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────
  
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }
}

// ─────────────────────────────────────────────
// USAGE EXAMPLE
// ─────────────────────────────────────────────

const monitor = new RingMonitor();

// Register agents
monitor.registerAgent({ id: 'agent1', name: 'Coder 1', type: 'coder', baseRate: 20, progress: 67 });
monitor.registerAgent({ id: 'agent2', name: 'Coder 2', type: 'coder', baseRate: 18, progress: 45 });
monitor.registerAgent({ id: 'agent3', name: 'Tester', type: 'tester', baseRate: 20, progress: 30 });
monitor.registerAgent({ id: 'agent4', name: 'Reviewer', type: 'reviewer', baseRate: 20, progress: 0 });

// Subscribe to events
monitor.on('agent:velocity_changed', (agent: Agent) => {
  console.log(`[Ring Update] ${agent.name}: ${agent.currentVelocity.toFixed(1)}x (${agent.ringState.status})`);
});

monitor.on('impediment:added', (imp: Impediment) => {
  const type = IMPEDIMENT_TYPES[imp.typeId];
  console.log(`[Impediment] ${type.icon} ${type.name} on ${imp.agentId}`);
});

// Simulate impediments
monitor.addImpediment('agent3', 'rate_limit', { resetIn: 240 });
monitor.addImpediment('agent4', 'approval_gate', { prNumber: 142 });
monitor.addImpediment('agent1', 'context_switch');

// Get system metrics
const metrics = monitor.getSystemMetrics(127);
console.log('\n=== System Metrics ===');
console.log(`Active Agents: ${metrics.activeAgents}/${metrics.totalAgents}`);
console.log(`System Velocity: ${metrics.systemVelocityPercent.toFixed(1)}%`);
console.log(`ETA (AI): ${metrics.etaAI.toFixed(1)} hours`);
console.log(`ETA (Human): ${metrics.etaHuman} hours (~${(metrics.etaHuman / 40).toFixed(1)} weeks)`);
console.log(`\nLosses:`);
console.log(`  Blocking: -${metrics.lossToBlocking.toFixed(1)}%`);
console.log(`  Throttling: -${metrics.lossToThrottling.toFixed(1)}%`);
console.log(`  Friction: -${metrics.lossToFriction.toFixed(1)}%`);

// Get ring parameters for UI
const ringParams = monitor.getRingParameters('agent1');
console.log('\nRing Animation (agent1):', ringParams);

export { RingMonitor, IMPEDIMENT_TYPES, Agent, Impediment, SystemMetrics };
