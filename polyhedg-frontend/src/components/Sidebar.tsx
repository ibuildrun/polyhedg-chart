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
    <aside className="sidebar">
      {/* Logo at top */}
      <div className="sidebar-header">
        <div className="logo-container">
          <Image
            src="/logo.png"
            alt="Polyhedg Logo"
            width={28}
            height={28}
            className="h-8 w-auto"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Create Hedge Button */}
      <div className="sidebar-content">
        <button className="create-hedge-btn" onClick={handleCreateHedge}>
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
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Hedge
        </button>

        {/* Hedges List */}
        <div className="hedges-section">
          <h3 className="hedges-title">Hedges</h3>
          <div className="hedges-list">
            {hedges.map((hedge) => (
              <div
                key={hedge.id}
                className={`hedge-item ${selectedHedgeId === hedge.id ? "selected" : ""}`}
                onClick={() => handleHedgeClick(hedge.id)}
              >
                <span className="hedge-name">{hedge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Info at bottom */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <span className="user-initials">JD</span>
          </div>
          <div className="user-details">
            <span className="user-name">John Doe</span>
            <span className="user-description">CFO at Stephens and Co</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
