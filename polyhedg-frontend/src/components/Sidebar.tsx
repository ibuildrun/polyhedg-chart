"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Hedge {
  id: string;
  name: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [hedges, setHedges] = useState<Hedge[]>([
    { id: "1", name: "Currency Risk Shield" },
    { id: "2", name: "Commodity Protection" },
  ]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedHedgeId, setSelectedHedgeId] = useState<string | null>(null);

  // Load hedges from sessionStorage after hydration
  useEffect(() => {
    setIsHydrated(true);

    try {
      const storedHedges = sessionStorage.getItem("hedges");
      if (storedHedges) {
        const parsedHedges = JSON.parse(storedHedges);
        const sidebarHedges = parsedHedges.map((hedge: any) => ({
          id: hedge.id,
          name: hedge.name,
        }));
        setHedges(sidebarHedges);
      } else {
        // No default hedges - start with empty list
        setHedges([]);
      }
    } catch (error) {
      console.error("Error loading hedges from sessionStorage:", error);
    }
  }, []);

  // Detect current hedge from URL and set as selected
  useEffect(() => {
    if (pathname && pathname !== "/") {
      // Extract hedge name from pathname (e.g., "/hedge-name" -> "hedge-name")
      const currentHedgeName = pathname.substring(1);

      // Find the hedge that matches this URL name
      const storedHedges = sessionStorage.getItem("hedges");
      if (storedHedges) {
        const parsedHedges = JSON.parse(storedHedges);
        const matchingHedge = parsedHedges.find(
          (h: any) => h.urlName === currentHedgeName,
        );
        if (matchingHedge) {
          setSelectedHedgeId(matchingHedge.id);
        }
      }
    } else {
      setSelectedHedgeId(null);
    }
  }, [pathname]);

  const handleCreateHedge = () => {
    // Navigate to home page using Next.js router
    router.push("/");
  };

  const handleHedgeClick = (hedgeId: string) => {
    // Find the hedge data from sessionStorage
    const storedHedges = sessionStorage.getItem("hedges");
    if (storedHedges) {
      const parsedHedges = JSON.parse(storedHedges);
      const hedge = parsedHedges.find((h: any) => h.id === hedgeId);
      if (hedge && hedge.urlName) {
        router.push(`/${hedge.urlName}`);
      }
    }
  };

  useEffect(() => {
    const handleHedgeCreated = (event: CustomEvent) => {
      const { name, description, urlName } = event.detail;
      const newHedge: Hedge = {
        id: Date.now().toString(),
        name: name,
      };

      // Add to sidebar
      setHedges((prev) => [...prev, newHedge]);

      // Store in sessionStorage for the hedge page
      const hedgeData = {
        id: newHedge.id,
        name: name,
        description: description,
        urlName: urlName,
        createdAt: new Date().toISOString(),
      };

      const existingHedges = JSON.parse(
        sessionStorage.getItem("hedges") || "[]",
      );
      existingHedges.push(hedgeData);
      sessionStorage.setItem("hedges", JSON.stringify(existingHedges));
    };

    window.addEventListener(
      "hedgeCreated",
      handleHedgeCreated as EventListener,
    );

    return () => {
      window.removeEventListener(
        "hedgeCreated",
        handleHedgeCreated as EventListener,
      );
    };
  }, []);

  return (
    <aside className="sidebar glass-sidebar">
      {/* Logo at top */}
      <div className="sidebar-header">
        <div className="logo-container">
          <Image
            src="/logo.png"
            alt="Polyhedg Logo"
            width={200}
            height={50}
            className="logo-image"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Create Hedge Button */}
      <div className="sidebar-content">
        <button
          className="create-hedge-btn glass-button-primary"
          onClick={handleCreateHedge}
        >
          <svg
            className="btn-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="btn-text">New Hedge</span>
        </button>

        {/* Hedges List */}
        <div className="hedges-section">
          <div className="section-header">
            <h3 className="hedges-title">Your Hedges</h3>
            <span className="hedges-count">{hedges.length}</span>
          </div>
          <div className="hedges-list">
            {hedges.length === 0 ? (
              <div className="empty-state">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  opacity="0.3"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
                <p className="empty-text">No hedges yet</p>
                <p className="empty-subtext">Create your first hedge to get started</p>
              </div>
            ) : (
              hedges.map((hedge) => (
                <div
                  key={hedge.id}
                  className={`hedge-item ${selectedHedgeId === hedge.id ? "selected" : ""}`}
                  onClick={() => handleHedgeClick(hedge.id)}
                >
                  <div className="hedge-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <span className="hedge-name">{hedge.name}</span>
                  {selectedHedgeId === hedge.id && (
                    <div className="active-indicator" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Info at bottom */}
      <div className="sidebar-footer glass-footer">
        <div className="user-info">
          <div className="user-avatar">
            <span className="user-initials">JD</span>
          </div>
          <div className="user-details">
            <span className="user-name">John Doe</span>
            <span className="user-description">CFO at Stephens and Co</span>
          </div>
          <button className="user-menu-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
