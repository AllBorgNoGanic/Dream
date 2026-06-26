import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import ShepherdMark from "./ShepherdMark";
import {
  fetchPackages as fetchRcPackages,
  purchasePackage as purchaseRcPackage,
  restorePurchases as rcRestorePurchases,
} from "../lib/revenuecat";
import { trackEvent } from "../lib/posthog";

export default function UpgradeModal({
  open,
  onOpenChange,
  onPurchaseSuccess,
  toast,
}) {
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [rcPackages, setRcPackages] = useState({ monthly: null, annual: null });
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [trialEnabled, setTrialEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const pkgs = await fetchRcPackages();
      if (!cancelled) setRcPackages(pkgs);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const annualProduct = rcPackages.annual?.product;
  const monthlyProduct = rcPackages.monthly?.product;

  const hasFreeTrial = annualProduct?.introPrice?.periodUnit === "DAY"
    || annualProduct?.introPrice?.price === 0
    || annualProduct?.introPrice?.periodNumberOfUnits > 0;
  const trialDays = annualProduct?.introPrice?.periodNumberOfUnits || 7;

  const handlePurchase = async () => {
    const isWeb = typeof window !== "undefined" && !window.Capacitor?.isNativePlatform?.();
    if (isWeb) {
      toast.info("Subscriptions are available in the Dream Shepherd app for iPhone and Android.");
      return;
    }
    const pkg = selectedPlan === "annual" ? rcPackages.annual : rcPackages.monthly;
    if (!pkg) {
      toast.error("Plans are still loading. Please try again in a moment.");
      return;
    }
    trackEvent("subscription_purchase_attempted", { plan: selectedPlan });
    setPurchasing(true);
    try {
      const result = await purchaseRcPackage(pkg);
      if (result.cancelled) return;
      if (!result.success) {
        toast.error(result.error || "Purchase could not be completed.");
        return;
      }
      if (result.entitled) {
        onPurchaseSuccess?.();
        toast.success("Thank you for supporting Dream Shepherd.");
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Purchase failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await rcRestorePurchases();
      if (restored) {
        toast.success("Purchases restored!");
        onPurchaseSuccess?.();
        onOpenChange(false);
      } else {
        toast.info("No previous purchases found.");
      }
    } catch {
      toast.error("Could not restore purchases. Try again.");
    } finally {
      setRestoring(false);
    }
  };

  const features = [
    "Unlimited dream interpretations",
    "Unlimited dream visualizations",
    "Unlimited prayers over your dreams",
    "Advanced pattern insights",
    "Helps us keep the lights on",
    "100% ad free",
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)", zIndex: 100,
        }} />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "linear-gradient(165deg, rgba(16,4,40,0.98), rgba(8,2,24,0.99))",
            border: "1px solid rgba(200,160,50,0.45)",
            borderRadius: 24, padding: 0, maxWidth: 420, width: "94%",
            boxShadow: "0 20px 80px rgba(110,70,5,0.4), 0 0 40px rgba(104,71,192,0.15)",
            animation: "fadeIn 0.3s ease", zIndex: 101,
            maxHeight: "92vh", overflowY: "auto",
            overflow: "hidden",
          }}
        >
          {/* Background art */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 24 }}>
            <div style={{
              position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
              width: 320, height: 320, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(104,71,192,0.05) 40%, transparent 70%)",
            }} />
            <div style={{
              position: "absolute", bottom: -60, left: -40,
              width: 240, height: 240, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(200,160,50,0.06) 0%, transparent 70%)",
            }} />
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
              {[
                [12, 8, 1.2], [85, 5, 0.8], [45, 12, 1.0], [92, 18, 0.6],
                [8, 25, 0.7], [72, 22, 1.1], [30, 30, 0.5], [95, 35, 0.9],
                [18, 42, 0.8], [60, 38, 0.6], [5, 55, 1.0], [88, 50, 0.7],
                [38, 58, 0.5], [75, 62, 0.8], [15, 70, 0.6], [55, 72, 0.9],
                [90, 75, 0.5], [25, 82, 0.7], [68, 85, 0.6], [42, 92, 0.8],
                [8, 95, 0.5], [82, 90, 0.7], [50, 48, 0.4], [20, 15, 0.6],
              ].map(([x, y, r], i) => (
                <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="#f5e4b0" opacity={0.15 + (i % 3) * 0.08} />
              ))}
            </svg>
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(200,160,50,0.1)", border: "1px solid rgba(200,160,50,0.15)",
              borderRadius: "50%", width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 2, padding: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="#9a8050" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </Dialog.Close>

          {/* Header */}
          <div style={{
            textAlign: "center", padding: "40px 24px 0",
            background: "linear-gradient(180deg, rgba(104,71,192,0.12) 0%, transparent 100%)",
            borderRadius: "24px 24px 0 0",
            position: "relative",
          }}>
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {[
                [8, 12, 1.3, 0.6], [18, 35, 0.9, 0.4], [30, 8, 1.5, 0.7],
                [42, 28, 1.0, 0.45], [55, 15, 1.4, 0.65], [68, 38, 0.8, 0.35],
                [78, 10, 1.2, 0.55], [90, 30, 1.1, 0.5], [14, 60, 0.7, 0.3],
                [25, 50, 1.0, 0.4], [50, 45, 0.8, 0.35], [72, 55, 0.9, 0.4],
                [85, 48, 1.1, 0.45], [38, 62, 0.7, 0.3], [62, 8, 0.9, 0.5],
                [95, 20, 0.8, 0.4], [5, 42, 1.0, 0.45], [48, 58, 0.6, 0.25],
                [82, 65, 0.7, 0.3], [35, 22, 0.6, 0.3], [60, 48, 0.7, 0.3],
                [92, 55, 0.8, 0.35], [20, 18, 0.7, 0.35], [75, 32, 0.6, 0.25],
              ].map(([x, y, r, o], i) => (
                <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="#f5e4b0" opacity={o} />
              ))}
            </svg>
            <div style={{ marginBottom: 12 }}>
              <ShepherdMark size={48} animate />
            </div>
            <Dialog.Title style={{
              fontSize: 24, fontWeight: 400, margin: "0 0 8px",
              fontFamily: "Georgia, serif",
              background: "linear-gradient(135deg, #f5e4b0, #e8b840, #a07010)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Support Dream Shepherd
            </Dialog.Title>
            <div style={{
              fontSize: 13, color: "#c8a050", lineHeight: 1.6, fontStyle: "italic",
              maxWidth: 300, margin: "0 auto 20px",
            }}>
              Unlock every feature and help a small team keep building.
            </div>
          </div>

          {/* Features */}
          <div style={{ padding: "0 24px 20px" }}>
            <div style={{
              display: "flex", flexDirection: "column", gap: 14,
              padding: "18px 0",
              borderTop: "1px solid rgba(200,160,50,0.18)",
              borderBottom: "1px solid rgba(200,160,50,0.18)",
            }}>
              {features.map((text) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                    <circle cx="10" cy="10" r="10" fill="rgba(200,160,50,0.15)" />
                    <path d="M6 10.5L9 13.5L14.5 7.5" stroke="#e8b840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 15, color: "#fff", fontWeight: 400, fontFamily: "Georgia, serif", letterSpacing: 0.3 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Annual plan */}
            <button
              onClick={() => setSelectedPlan("annual")}
              style={{
                position: "relative", width: "100%", textAlign: "left",
                padding: "16px 18px", borderRadius: 16, cursor: "pointer",
                border: selectedPlan === "annual"
                  ? "1.5px solid rgba(232,184,64,0.7)"
                  : "1px solid rgba(200,160,50,0.25)",
                background: selectedPlan === "annual"
                  ? "rgba(200,160,50,0.12)"
                  : "rgba(200,160,50,0.03)",
                fontFamily: "Georgia, serif",
                transition: "all 0.2s",
              }}
            >
              {trialEnabled && (
                <div style={{
                  position: "absolute", top: -10, right: 16,
                  background: "linear-gradient(135deg, #6847c0, #9066d4)",
                  color: "#fff", fontSize: 10, fontWeight: 600,
                  padding: "3px 10px", borderRadius: 10,
                  letterSpacing: 0.5,
                }}>
                  {trialDays}-DAY FREE TRIAL
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{
                    fontSize: 15, color: selectedPlan === "annual" ? "#f5e4b0" : "#9a8050",
                    fontWeight: 600, marginBottom: 2,
                  }}>
                    Annual
                  </div>
                  <div style={{ fontSize: 11, color: "#9a8a50" }}>
                    {trialEnabled ? `${trialDays} days free, then billed yearly` : "Billed yearly"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: 20, color: selectedPlan === "annual" ? "#f5e4b0" : "#9a8050",
                    fontWeight: 400,
                  }}>
                    {annualProduct?.priceString || "$59.99"}
                    <span style={{ fontSize: 11, color: "#9a8a50" }}>/yr</span>
                  </div>
                  <div style={{
                    fontSize: 10, color: "#b090e0",
                    background: "rgba(104,71,192,0.2)", padding: "2px 8px",
                    borderRadius: 8, display: "inline-block", marginTop: 2,
                  }}>
                    Save 37%
                  </div>
                </div>
              </div>
            </button>

            {/* Monthly plan */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              style={{
                width: "100%", textAlign: "left",
                padding: "16px 18px", borderRadius: 16, cursor: "pointer",
                border: selectedPlan === "monthly"
                  ? "1.5px solid rgba(232,184,64,0.7)"
                  : "1px solid rgba(200,160,50,0.25)",
                background: selectedPlan === "monthly"
                  ? "rgba(200,160,50,0.12)"
                  : "rgba(200,160,50,0.03)",
                fontFamily: "Georgia, serif",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{
                    fontSize: 15, color: selectedPlan === "monthly" ? "#f5e4b0" : "#9a8050",
                    fontWeight: 600, marginBottom: 2,
                  }}>
                    Monthly
                  </div>
                  <div style={{ fontSize: 11, color: "#9a8a50" }}>Cancel anytime</div>
                </div>
                <div style={{
                  fontSize: 20, color: selectedPlan === "monthly" ? "#f5e4b0" : "#9a8050",
                  fontWeight: 400,
                }}>
                  {monthlyProduct?.priceString || "$7.99"}
                  <span style={{ fontSize: 11, color: "#9a8a50" }}>/mo</span>
                </div>
              </div>
            </button>
          </div>

          {/* Trial switcher */}
          <div style={{
            padding: "14px 24px 0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid rgba(200,160,50,0.08)",
            marginTop: 14, marginLeft: 24, marginRight: 24,
            paddingLeft: 0, paddingRight: 0,
          }}>
            <span style={{
              fontSize: 13, color: "#d4b460", fontFamily: "Georgia, serif",
            }}>
              Not sure yet? Enable free trial
            </span>
            <button
              onClick={() => {
                setTrialEnabled(!trialEnabled);
                if (!trialEnabled) setSelectedPlan("annual");
              }}
              style={{
                position: "relative", width: 44, height: 24,
                borderRadius: 12, border: "none", cursor: "pointer",
                background: trialEnabled
                  ? "linear-gradient(135deg, #6847c0, #9066d4)"
                  : "rgba(200,160,50,0.15)",
                transition: "background 0.2s",
                padding: 0, flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 2,
                left: trialEnabled ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%",
                background: trialEnabled ? "#fff" : "#6b5c30",
                transition: "left 0.2s, background 0.2s",
              }} />
            </button>
          </div>

          {/* CTA */}
          <div style={{ padding: "20px 24px 0" }}>
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              style={{
                width: "100%",
                background: "transparent",
                border: "1.5px solid rgba(168,85,247,0.6)",
                color: "#c4a0f0", padding: "16px",
                borderRadius: 14, fontSize: 16, fontWeight: 600,
                cursor: purchasing ? "default" : "pointer",
                letterSpacing: 0.5, minHeight: 52,
                fontFamily: "Georgia, serif",
                opacity: purchasing ? 0.7 : 1,
                boxShadow: "0 0 15px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)",
                transition: "all 0.2s",
              }}
            >
              {purchasing
                ? "Processing..."
                : trialEnabled && selectedPlan === "annual"
                  ? "Start Free Trial"
                  : "Become a Supporter"}
            </button>
            {trialEnabled && selectedPlan === "annual" && (
              <div style={{
                textAlign: "center", fontSize: 11, color: "#9a8a50",
                marginTop: 6, lineHeight: 1.4,
              }}>
                {trialDays} days free. Cancel anytime during your trial.
              </div>
            )}
          </div>

          {/* Footer links */}
          <div style={{ padding: "16px 24px 20px", textAlign: "center" }}>
            <Dialog.Close asChild>
              <button style={{
                background: "none", border: "none", color: "#8a7a48",
                fontSize: 13, cursor: "pointer", padding: "10px 16px",
                minHeight: 44, fontFamily: "Georgia, serif",
              }}>
                Not right now
              </button>
            </Dialog.Close>
            <div style={{
              display: "flex", justifyContent: "center", gap: 16, marginTop: 4,
            }}>
              <button
                onClick={handleRestore}
                disabled={restoring}
                style={{
                  background: "none", border: "none", color: "#8a7a48",
                  fontSize: 11, cursor: "pointer", padding: "4px 8px",
                  fontFamily: "Georgia, serif", textDecoration: "underline",
                  opacity: restoring ? 0.5 : 1,
                }}
              >
                {restoring ? "Restoring..." : "Restore purchases"}
              </button>
              <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{
                color: "#8a7a48", fontSize: 11, fontFamily: "Georgia, serif",
                textDecoration: "underline", padding: "4px 8px",
              }}>
                Terms
              </a>
              <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{
                color: "#8a7a48", fontSize: 11, fontFamily: "Georgia, serif",
                textDecoration: "underline", padding: "4px 8px",
              }}>
                Privacy
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
