import type { AgentContext, GeoRiskOutput, SupplyChainOutput } from "./types";

export class SupplyChainAgent {
  public readonly name = "Supply Chain Agent" as const;

  run(context: AgentContext, geoRisk: GeoRiskOutput): SupplyChainOutput {
    const highRiskRegions = new Set(geoRisk.affectedRegions.map(region => region.toLowerCase()));
    const riskPressure = geoRisk.riskScore / 100;
    const delayedRoutes = context.graph.edges
      .filter(edge => edge.type === "travels_to" || edge.type === "connected_to")
      .map(edge => {
        const source = context.graph.nodes.find(node => node.id === edge.source);
        const target = context.graph.nodes.find(node => node.id === edge.target);
        const routeName = `${source?.label || edge.source} -> ${target?.label || edge.target}`;
        const affected = [source?.label, target?.label].some(label => label && [...highRiskRegions].some(region => label.toLowerCase().includes(region) || region.includes(label.toLowerCase())));
        const delayDays = Math.round((edge.riskScore / 18 + (affected ? geoRisk.riskScore / 22 : 0)) * 10) / 10;
        return { route: routeName, delayDays, cause: affected ? "GeoRisk affected route" : edge.evidence, risk: Math.max(edge.riskScore, affected ? geoRisk.riskScore : 0) };
      })
      .filter(route => route.delayDays >= 2.5)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 6);

    const affectedPorts = context.graph.nodes
      .filter(node => node.type === "Port")
      .map(node => ({ port: node.label, status: node.riskScore >= 70 ? "disrupted" : node.riskScore >= 45 ? "watch" : "nominal", risk: Math.max(node.riskScore, highRiskRegions.has(node.label.toLowerCase()) ? geoRisk.riskScore : 0) }))
      .filter(port => port.risk >= 30)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 6);

    const affectedTankers = context.ships.map(ship => {
      const routeRisk = delayedRoutes[0]?.risk ?? geoRisk.riskScore;
      return {
        tanker: ship.name,
        status: routeRisk >= 70 ? "reroute watch" : ship.status,
        transitTimeDays: Math.max(ship.etaDays, Math.round(ship.etaDays + routeRisk / 20)),
        risk: Math.max(ship.riskScore, Math.round(routeRisk * 0.72))
      };
    });

    const baselineDays = Math.round(context.ships.reduce((sum, ship) => sum + ship.etaDays, 0) / Math.max(context.ships.length, 1));
    const currentDays = Math.round(affectedTankers.reduce((sum, ship) => sum + ship.transitTimeDays, 0) / Math.max(affectedTankers.length, 1));

    return {
      agent: this.name,
      delayedRoutes,
      affectedPorts,
      affectedTankers,
      bottlenecks: [...affectedPorts.slice(0, 3).map(port => ({ node: port.port, reason: port.status, severity: port.risk })), ...delayedRoutes.slice(0, 2).map(route => ({ node: route.route, reason: route.cause, severity: route.risk }))],
      transitTime: { baselineDays, currentDays, deltaDays: Math.max(0, currentDays - baselineDays) },
      confidence: Math.max(62, Math.min(96, Math.round(geoRisk.confidence * 0.82 + delayedRoutes.length * 3 + affectedTankers.length)))
    };
  }
}
