"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

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
  position: { x: number; y: number };
  data: { label: string; nodeId: string };
  style: any;
  selected: boolean;
}

export default function HedgePage() {
  const params = useParams();
  const hedgeName = params.hedgeName as string;
  const [hedgeData, setHedgeData] = useState<HedgeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
    // Find the graph node and center on it
    const graphNode = graphNodes.find((gn) => gn.data.nodeId === nodeId);
    if (graphNode) {
      // This would trigger React Flow to center on the node
      // Implementation depends on React Flow's API
      console.log(`Centering on node: ${nodeId}`);
    }
  };

  // Generate graph nodes and edges from node data
  const generateGraphData = (nodeData: NodeData[]) => {
    // Create contract nodes with randomized positions for natural graph layout
    const newGraphNodes: GraphNode[] = nodeData.map((node, index) => {
      // Generate random positions within a reasonable area
      const minX = 100;
      const maxX = 800;
      const minY = 100;
      const maxY = 600;

      // Add some spacing to avoid overlap
      const x = minX + ((index * 120) % (maxX - minX)) + Math.random() * 50;
      const y = minY + Math.floor(index / 6) * 120 + Math.random() * 50;

      return {
        id: `graph-${node.id}`,
        type: "custom",
        position: { x, y },
        data: {
          label: node.title,
          nodeId: node.id,
        },
        style: {
          background: node.selected
            ? "rgba(168, 85, 247, 0.2)"
            : "rgba(255, 255, 255, 0.05)",
          border: node.selected
            ? "2px solid #a855f7"
            : "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          fontWeight: "500",
          color: "#ffffff",
          boxShadow: node.selected
            ? "0 0 20px rgba(168, 85, 247, 0.5)"
            : "none",
          width: "120px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        },
        selected: node.selected,
      };
    });

    // Generate edges based on node connections
    const newGraphEdges: Edge[] = [];

    // Create simple test edges first - try different approaches
    if (newGraphNodes.length >= 2) {
      newGraphEdges.push({
        id: "test-edge-1",
        source: newGraphNodes[0].id,
        target: newGraphNodes[1].id,
        type: "default",
        style: {
          stroke: "#ff0000",
          strokeWidth: 10,
        },
      });
    }

    if (newGraphNodes.length >= 3) {
      newGraphEdges.push({
        id: "test-edge-2",
        source: newGraphNodes[1].id,
        target: newGraphNodes[2].id,
        type: "default",
        style: {
          stroke: "#00ff00",
          strokeWidth: 10,
        },
      });
    }

    if (newGraphNodes.length >= 4) {
      newGraphEdges.push({
        id: "test-edge-3",
        source: newGraphNodes[0].id,
        target: newGraphNodes[3].id,
        type: "default",
        style: {
          stroke: "#0000ff",
          strokeWidth: 10,
        },
      });
    }

    // Try even more simple edges
    if (newGraphNodes.length >= 5) {
      newGraphEdges.push({
        id: "test-edge-4",
        source: newGraphNodes[2].id,
        target: newGraphNodes[4].id,
        style: {
          stroke: "#ffff00",
          strokeWidth: 15,
        },
      });
    }

    // Add edges from each node to its connected nodes
    nodeData.forEach((node) => {
      node.connections.forEach((connectedNodeId) => {
        // Check if the connected node exists in our data
        const connectedNode = nodeData.find((n) => n.id === connectedNodeId);
        if (connectedNode) {
          // Create edge with unique ID
          const edgeId = `edge-${node.id}-${connectedNodeId}`;
          const reverseEdgeId = `edge-${connectedNodeId}-${node.id}`;

          // Avoid duplicate edges
          if (
            !newGraphEdges.find(
              (e) => e.id === edgeId || e.id === reverseEdgeId,
            )
          ) {
            newGraphEdges.push({
              id: edgeId,
              source: `graph-${node.id}`,
              target: `graph-${connectedNodeId}`,
              type: "straight",
              style: {
                stroke: "#ffffff",
                strokeWidth: 3,
              },
            });
          }
        }
      });
    });

    console.log("Generated nodes:", newGraphNodes.length);
    console.log("Generated edges:", newGraphEdges.length);
    console.log("Node data:", nodeData);
    console.log("Edges:", newGraphEdges);
    console.log("First few nodes:", newGraphNodes.slice(0, 3));
    console.log("First few edges:", newGraphEdges.slice(0, 3));

    // Force a simple test
    if (newGraphNodes.length >= 2) {
      console.log(
        "Testing edge between:",
        newGraphNodes[0].id,
        "and",
        newGraphNodes[1].id,
      );
      console.log("Node 0 position:", newGraphNodes[0].position);
      console.log("Node 1 position:", newGraphNodes[1].position);
    }

    setGraphNodes(newGraphNodes);
    setGraphEdges(newGraphEdges);
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
  const handleNodeClick = (event: any, node: any) => {
    const nodeId = node.data.nodeId;
    setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
  };

  // Custom node component
  const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
    return (
      <div className="custom-node">
        <div className="node-content">
          <div className="node-label">{data.label}</div>
        </div>
      </div>
    );
  };

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
        {/* Full-width React Flow graph */}
        <div className="flow-container">
          <div className="flow-header">
            <div className="button-group">
              <button
                className={`execute-button ${isExecuting ? "executing" : ""}`}
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
                <button className="stop-button" onClick={handleStop}>
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
          <ReactFlow
            nodes={graphNodes}
            edges={graphEdges}
            onNodeClick={handleNodeClick}
            fitView={false}
            className="hedge-flow"
            nodeTypes={{
              custom: CustomNode,
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
          </ReactFlow>

          {/* Profit Stats Card - Bottom Left */}
          {isExecuting && (
            <div className="profit-stats-card">
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
