"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
// @ts-ignore - d3-force types not required for build
import * as d3 from "d3-force";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface HedgeData {
  id: string;
  name: string;
  description: string;
  urlName: string;
  createdAt: string;
}

interface NodeData {
  id: string;
  title: string;
  value: string;
  change: string;
  type: "positive" | "negative" | "neutral";
  selected: boolean;
  size: "small" | "medium" | "large";
  connections: string[];
}

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  nodeData: NodeData;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  color: string;
  width: number;
}

export default function HedgePage() {
  const params = useParams();
  const hedgeName = params.hedgeName as string;
  const [hedgeData, setHedgeData] = useState<HedgeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({ nodes: [], links: [] });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<any>(null);
  
  // Configure force simulation after mount
  useEffect(() => {
    if (graphRef.current) {
      // Configure forces to spread nodes far apart with larger collision radius
      graphRef.current.d3Force("charge", d3.forceManyBody().strength(-2000));
      graphRef.current.d3Force("link", d3.forceLink().distance(350).strength(0.2));
      graphRef.current.d3Force("center", d3.forceCenter().strength(0.015));
      graphRef.current.d3Force("collision", d3.forceCollide().radius(120));
    }
  }, [graphData]);

  // Profit stats data
  const profitStats = {
    currentProfit: "+$2,450",
    profitChange: "+12.3%",
    positionValue: "$125,000",
    unrealizedPnL: "+$1,850",
    realizedPnL: "+$600",
    executionTime: "2m 34s",
  };

  const handleExecute = () => {
    setIsExecuting(true);
    // Store execution state in sessionStorage
    sessionStorage.setItem("hedgeExecuting", "true");
  };

  const handleStop = () => {
    setIsExecuting(false);
    // Remove execution state from sessionStorage
    sessionStorage.removeItem("hedgeExecuting");
  };

  // Node management functions
  const toggleNodeSelection = (nodeId: string) => {
    setNodes((prev) => {
      const updatedNodes = prev.map((node) =>
        node.id === nodeId ? { ...node, selected: !node.selected } : node,
      );
      // Save to session storage
      sessionStorage.setItem("hedgeNodes", JSON.stringify(updatedNodes));
      return updatedNodes;
    });
  };

  const removeNode = (nodeId: string) => {
    setNodes((prev) => {
      const updatedNodes = prev.filter((node) => node.id !== nodeId);
      sessionStorage.setItem("hedgeNodes", JSON.stringify(updatedNodes));
      return updatedNodes;
    });
  };

  const addNode = (nodeId: string) => {
    setNodes((prev) => {
      const updatedNodes = prev.map((node) =>
        node.id === nodeId ? { ...node, selected: true } : node,
      );
      sessionStorage.setItem("hedgeNodes", JSON.stringify(updatedNodes));
      return updatedNodes;
    });
  };

  const centerOnNode = (nodeId: string) => {
    const graphNode = graphData.nodes.find((gn) => gn.id === nodeId);
    if (graphNode && graphRef.current) {
      graphRef.current.centerAt(graphNode.x, graphNode.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  };

  // Generate graph data for react-force-graph
  const generateGraphData = (nodeData: NodeData[]) => {
    const newGraphNodes: GraphNode[] = nodeData.map((node) => {
      // Determine node size based on size property - much larger for better visibility
      const sizeMap = { small: 12, medium: 16, large: 20 };
      const nodeSize = sizeMap[node.size];

      // Determine color based on selection and type
      let color = "rgba(168, 85, 247, 0.8)"; // Default purple
      if (node.selected) {
        color = "rgba(168, 85, 247, 1)"; // Bright purple for selected
      } else {
        // Use different colors based on type when not selected
        if (node.type === "positive") color = "rgba(34, 197, 94, 0.7)";
        else if (node.type === "negative") color = "rgba(239, 68, 68, 0.7)";
        else color = "rgba(156, 163, 175, 0.7)";
      }

      return {
        id: node.id,
        name: node.title,
        val: nodeSize,
        color: color,
        nodeData: node,
      };
    });

    // Generate links based on node connections
    const newGraphLinks: GraphLink[] = [];
    nodeData.forEach((node) => {
      node.connections.forEach((connectedNodeId) => {
        const connectedNode = nodeData.find((n) => n.id === connectedNodeId);
        if (connectedNode) {
          // Check if link already exists in either direction
          const linkExists = newGraphLinks.some(
            (link) =>
              (link.source === node.id && link.target === connectedNodeId) ||
              (link.source === connectedNodeId && link.target === node.id),
          );

          if (!linkExists) {
            newGraphLinks.push({
              source: node.id,
              target: connectedNodeId,
              color: node.selected || connectedNode.selected 
                ? "rgba(168, 85, 247, 0.5)" 
                : "rgba(168, 85, 247, 0.25)",
              width: node.selected || connectedNode.selected ? 3 : 2,
            });
          }
        }
      });
    });

    setGraphData({ nodes: newGraphNodes, links: newGraphLinks });
  };

  // Initialize nodes data
  const initializeNodes = (): NodeData[] => [
    {
      id: "risk-score",
      title: "Risk Score",
      value: "7.2",
      change: "+0.3",
      type: "negative",
      selected: false,
      size: "large",
      connections: ["exposure", "volatility", "beta", "var", "max-drawdown"],
    },
    {
      id: "exposure",
      title: "Exposure",
      value: "$125K",
      change: "-2.1%",
      type: "positive",
      selected: true,
      size: "medium",
      connections: ["risk-score", "hedge-ratio", "liquidity", "cost-basis"],
    },
    {
      id: "volatility",
      title: "Volatility",
      value: "23.4%",
      change: "+1.2%",
      type: "negative",
      selected: true,
      size: "medium",
      connections: ["risk-score", "beta", "sharpe-ratio", "max-drawdown"],
    },
    {
      id: "hedge-ratio",
      title: "Hedge Ratio",
      value: "0.85",
      change: "+0.05",
      type: "positive",
      selected: false,
      size: "small",
      connections: ["exposure", "correlation", "duration"],
    },
    {
      id: "correlation",
      title: "Correlation",
      value: "0.72",
      change: "-0.03",
      type: "neutral",
      selected: false,
      size: "small",
      connections: ["hedge-ratio", "duration", "beta"],
    },
    {
      id: "duration",
      title: "Duration",
      value: "45 days",
      change: "0",
      type: "neutral",
      selected: false,
      size: "small",
      connections: ["correlation", "hedge-ratio"],
    },
    {
      id: "beta",
      title: "Beta",
      value: "1.24",
      change: "+0.08",
      type: "negative",
      selected: false,
      size: "medium",
      connections: ["volatility", "risk-score", "sharpe-ratio", "correlation"],
    },
    {
      id: "sharpe-ratio",
      title: "Sharpe Ratio",
      value: "2.1",
      change: "+0.2",
      type: "positive",
      selected: false,
      size: "medium",
      connections: ["beta", "volatility", "max-drawdown", "var"],
    },
    {
      id: "max-drawdown",
      title: "Max Drawdown",
      value: "8.3%",
      change: "-1.1%",
      type: "positive",
      selected: false,
      size: "small",
      connections: ["sharpe-ratio", "risk-score", "var"],
    },
    {
      id: "var",
      title: "VaR (95%)",
      value: "$12.5K",
      change: "-$800",
      type: "positive",
      selected: false,
      size: "small",
      connections: ["max-drawdown", "risk-score", "sharpe-ratio", "liquidity"],
    },
    {
      id: "liquidity",
      title: "Liquidity",
      value: "High",
      change: "Stable",
      type: "neutral",
      selected: false,
      size: "small",
      connections: ["var", "exposure", "cost-basis"],
    },
    {
      id: "cost-basis",
      title: "Cost Basis",
      value: "$98.50",
      change: "+$2.10",
      type: "negative",
      selected: false,
      size: "small",
      connections: ["liquidity", "exposure"],
    },
  ];

  // Handle node click in graph
  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
    },
    [selectedNodeId],
  );

  // Handle node hover
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);
  }, []);

  // Custom node canvas painting
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Safety check - ensure node has valid coordinates
      if (!node.x || !node.y || !isFinite(node.x) || !isFinite(node.y)) {
        return;
      }

      const label = node.name;
      const fontSize = 14 / globalScale;
      const nodeRelSize = 3;

      // Draw node circle with glow effect
      const isSelected = node.nodeData.selected;
      const isHovered = hoveredNode?.id === node.id;

      const radius = nodeRelSize * node.val;
      const x = node.x;
      const y = node.y;

      // Draw outer glow for all nodes
      ctx.beginPath();
      ctx.arc(x, y, radius + 8, 0, 2 * Math.PI);
      const gradient = ctx.createRadialGradient(
        x,
        y,
        radius,
        x,
        y,
        radius + 8,
      );
      
      if (isSelected) {
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.4)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
      } else if (isHovered) {
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.25)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
      } else {
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.15)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
      }
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw main node circle with inner gradient
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      const nodeGradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius,
      );
      nodeGradient.addColorStop(0, node.color);
      nodeGradient.addColorStop(1, node.color.replace("0.7)", "0.5)").replace("0.8)", "0.6)").replace("1)", "0.8)"));
      ctx.fillStyle = nodeGradient;
      ctx.fill();

      // Draw glassmorphic border
      ctx.strokeStyle = isSelected
        ? "rgba(255, 255, 255, 0.9)"
        : "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = isSelected ? 3 / globalScale : 2 / globalScale;
      ctx.stroke();

      // Draw inner highlight
      ctx.beginPath();
      ctx.arc(
        x - radius * 0.25,
        y - radius * 0.25,
        radius * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fill();

      // Draw label with shadow
      ctx.font = `600 ${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Label shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillText(label, x, y + radius + 16);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    },
    [hoveredNode],
  );

  useEffect(() => {
    // Get hedge data from sessionStorage or API
    const storedHedges = sessionStorage.getItem("hedges");
    if (storedHedges) {
      const hedges = JSON.parse(storedHedges);
      const currentHedge = hedges.find((h: any) => h.urlName === hedgeName);
      if (currentHedge) {
        setHedgeData(currentHedge);
      }
    }

    // Check if hedge is currently executing
    const isCurrentlyExecuting =
      sessionStorage.getItem("hedgeExecuting") === "true";
    setIsExecuting(isCurrentlyExecuting);

    // Initialize nodes - load from session storage or use defaults
    const storedNodes = sessionStorage.getItem("hedgeNodes");
    let initialNodesData;
    if (storedNodes) {
      initialNodesData = JSON.parse(storedNodes);
    } else {
      initialNodesData = initializeNodes();
      sessionStorage.setItem("hedgeNodes", JSON.stringify(initialNodesData));
    }
    setNodes(initialNodesData);
    generateGraphData(initialNodesData);

    setIsLoading(false);
  }, [hedgeName]);

  // Update graph when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      generateGraphData(nodes);
    }
  }, [nodes]);

  const displayName = hedgeName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (isLoading) {
    return (
      <div className="hedge-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading hedge data...</p>
        </div>
      </div>
    );
  }

  if (!hedgeData) {
    return (
      <div className="hedge-page">
        <div className="hedge-content">
          <h1 className="hedge-title">Hedge Not Found</h1>
          <p className="hedge-description">
            The hedge you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hedge-page">
      <div className="hedge-layout">
        {/* Full-width Force Graph */}
        <div className="graph-container">
          <div className="graph-header">
            <div className="button-group">
              <button
                className={`execute-button glass-button ${isExecuting ? "executing" : ""}`}
                onClick={handleExecute}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <div className="spinner"></div>
                    Executing...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                    Execute
                  </>
                )}
              </button>

              {isExecuting && (
                <button
                  className="stop-button glass-button"
                  onClick={handleStop}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop
                </button>
              )}
            </div>
          </div>

          <div className="graph-wrapper">
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeLabel={(node: any) => node.name}
              nodeVal={(node: any) => node.val}
              nodeColor={(node: any) => node.color}
              nodeCanvasObject={paintNode}
              nodeCanvasObjectMode={() => "replace"}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              linkColor={(link: any) => link.color}
              linkWidth={(link: any) => link.width}
              linkDirectionalParticles={3}
              linkDirectionalParticleWidth={3}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleColor={(link: any) =>
                "rgba(168, 85, 247, 0.8)"
              }
              backgroundColor="rgba(0, 0, 0, 0)"
              cooldownTicks={150}
              d3VelocityDecay={0.3}
              d3AlphaDecay={0.015}
              d3AlphaMin={0.001}
              warmupTicks={50}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              enableNodeDrag={true}
            />
          </div>

          {/* Profit Stats Card - Bottom Left */}
          {isExecuting && (
            <div className="profit-stats-card glass-card">
              <div className="profit-header">
                <h4>Live Position</h4>
                <span className="execution-time">
                  {profitStats.executionTime}
                </span>
              </div>
              <div className="profit-metrics">
                <div className="profit-metric">
                  <span className="metric-label">Current Profit</span>
                  <span className="metric-value profit">
                    {profitStats.currentProfit}
                  </span>
                </div>
                <div className="profit-metric">
                  <span className="metric-label">Position Value</span>
                  <span className="metric-value">
                    {profitStats.positionValue}
                  </span>
                </div>
                <div className="profit-metric">
                  <span className="metric-label">Unrealized P&L</span>
                  <span className="metric-value profit">
                    {profitStats.unrealizedPnL}
                  </span>
                </div>
                <div className="profit-metric">
                  <span className="metric-label">Realized P&L</span>
                  <span className="metric-value profit">
                    {profitStats.realizedPnL}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - selected node details or selected nodes list */}
        <div className="hedge-sidebar-panel">
          <div className="cards-container">
            {selectedNodeId ? (
              // Show selected node details
              (() => {
                const selectedNode = nodes.find((n) => n.id === selectedNodeId);
                return selectedNode ? (
                  <div className="market-details">
                    <div className="market-header">
                      <h2 className="market-title">{selectedNode.title}</h2>
                      <div className="market-actions-top">
                        {selectedNode.selected ? (
                          <button
                            className="remove-market-btn-top"
                            onClick={() => {
                              toggleNodeSelection(selectedNodeId);
                              setSelectedNodeId(null);
                            }}
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            className="include-market-btn-top"
                            onClick={() => {
                              toggleNodeSelection(selectedNodeId);
                              setSelectedNodeId(null);
                            }}
                          >
                            Include
                          </button>
                        )}
                        <button
                          className="close-market-btn"
                          onClick={() => setSelectedNodeId(null)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="market-dates">
                      <div className="date-row">
                        <span className="date-label">Start Date</span>
                        <span className="date-value">Jan 15, 2024</span>
                      </div>
                      <div className="date-row">
                        <span className="date-label">End Date</span>
                        <span className="date-value">Dec 31, 2024</span>
                      </div>
                    </div>

                    <div className="market-description">
                      <p>
                        Will {selectedNode.title.toLowerCase()} occur before the
                        end of 2024? This prediction market allows traders to
                        bet on the outcome of this event.
                      </p>
                    </div>

                    <div className="market-image">
                      <img
                        src={`https://picsum.photos/400/200?random=${selectedNodeId}`}
                        alt={selectedNode.title}
                        className="market-img"
                      />
                    </div>

                    <div className="market-stats">
                      <div className="stat-row">
                        <span className="stat-label">Volume</span>
                        <span className="stat-value">$2,450,000</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Liquidity</span>
                        <span className="stat-value">$1,250,000</span>
                      </div>
                    </div>

                    <div className="outcomes-section">
                      <h4 className="outcomes-title">Outcomes</h4>
                      <div className="outcomes-list">
                        <div className="outcome-item">
                          <span className="outcome-label">Yes</span>
                          <span className="outcome-price">$0.65</span>
                        </div>
                        <div className="outcome-item">
                          <span className="outcome-label">No</span>
                          <span className="outcome-price">$0.35</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()
            ) : nodes.filter((node) => node.selected).length > 0 ? (
              // Show selected nodes list
              <div className="selected-nodes-list">
                <div className="selected-nodes-header">
                  <h3 className="selected-nodes-title">Selected Events</h3>
                  <span className="selected-count">
                    {nodes.filter((node) => node.selected).length} selected
                  </span>
                </div>

                <div className="selected-nodes-content">
                  {nodes
                    .filter((node) => node.selected)
                    .map((node) => (
                      <div
                        key={node.id}
                        className="selected-node-item"
                        onClick={() => setSelectedNodeId(node.id)}
                      >
                        <div className="node-item-header">
                          <h4 className="node-item-title">{node.title}</h4>
                          <span className={`node-item-change ${node.type}`}>
                            {node.change}
                          </span>
                        </div>
                        <div className="node-item-value">{node.value}</div>
                        <div className="node-item-question">
                          Will {node.title.toLowerCase()} occur before the end
                          of 2024?
                        </div>
                        <div className="node-item-dates">
                          <span className="date-info">
                            Jan 15 - Dec 31, 2024
                          </span>
                        </div>
                        <div className="node-item-outcomes">
                          <div className="outcome-option">
                            <span className="outcome-label">YES</span>
                            <span className="outcome-price">$0.65</span>
                          </div>
                          <div className="outcome-option">
                            <span className="outcome-label">NO</span>
                            <span className="outcome-price">$0.35</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <p className="no-selection-text">None Selected</p>
                <p className="no-selection-subtext">
                  Click on graph nodes to view details and select events
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
