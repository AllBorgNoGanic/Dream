import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "../lib/supabase";

export default function GalleryTab({ user, dreams, onViewReading }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("dream_images")
        .select("id, image_url, created_at, dream_id, dreams(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setImages(data || []);
      setLoading(false);
    };
    fetchImages();
  }, [user.id]);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#8a7540", textTransform: "uppercase", marginBottom: 6 }}>
          Dream Visions
        </div>
        <h2 style={{ fontSize: 22, color: "#f0dfa0", margin: 0, fontWeight: 400 }}>
          Your Gallery
        </h2>
        {images.length > 0 && (
          <div style={{ fontSize: 12, color: "#5a4a28", marginTop: 6 }}>
            {images.length} vision{images.length !== 1 ? "s" : ""} generated
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#5a4a28", fontSize: 14 }}>
          Loading your visions...
        </div>
      ) : images.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "rgba(6,12,22,0.7)",
          border: "1px solid rgba(200,160,30,0.15)",
          borderRadius: 18,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <div style={{ fontSize: 16, color: "#f5e4b0", marginBottom: 8 }}>No visions yet</div>
          <p style={{ fontSize: 13, color: "#5a4a28", lineHeight: 1.6, margin: 0 }}>
            Open any dream interpretation and tap<br />
            <span style={{ color: "#c8a040" }}>✦ Visualize Dream</span> to generate your first image.
          </p>
        </div>
      ) : (
        <>
          {/* Image grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}>
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                style={{
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "1px solid rgba(200,160,30,0.15)",
                  aspectRatio: "1 / 1",
                  background: "rgba(6,12,22,0.7)",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.borderColor = "rgba(200,160,30,0.4)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = "rgba(200,160,30,0.15)";
                }}
              >
                <img
                  src={img.image_url}
                  alt={img.dreams?.title || "Dream vision"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Overlay with title */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent, rgba(2,4,14,0.85))",
                  padding: "20px 10px 10px",
                }}>
                  <div style={{
                    fontSize: 11, color: "#d4a840",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {img.dreams?.title || "Untitled Dream"}
                  </div>
                  <div style={{ fontSize: 9, color: "#5a4a28", marginTop: 2 }}>
                    {formatDate(img.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      <Dialog.Root open={!!selectedImage} onOpenChange={(open) => { if (!open) setSelectedImage(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(2,4,14,0.95)",
          }} />
          <Dialog.Content
            aria-describedby={undefined}
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              maxWidth: 480, width: "94%", zIndex: 2001,
              animation: "fadeIn 0.2s ease", outline: "none",
            }}
          >
            {selectedImage && (
              <>
                {/* Title */}
                <Dialog.Title style={{ textAlign: "center", marginBottom: 14, fontWeight: 400 }}>
                  <div style={{ fontSize: 14, color: "#f0dfa0", fontStyle: "italic" }}>
                    {selectedImage.dreams?.title || "Untitled Dream"}
                  </div>
                  <div style={{ fontSize: 11, color: "#5a4a28", marginTop: 4, fontWeight: 400 }}>
                    {formatDate(selectedImage.created_at)}
                  </div>
                </Dialog.Title>

                {/* Image */}
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.dreams?.title || "Dream vision"}
                  style={{ width: "100%", borderRadius: 18, display: "block" }}
                />

                {/* Actions */}
                <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "center" }}>
                  {onViewReading && dreams && (() => {
                    const dream = dreams.find(d => d.id === selectedImage.dream_id);
                    return dream?.interpretation ? (
                      <button
                        onClick={() => { setSelectedImage(null); onViewReading(dream); }}
                        style={{
                          background: "none",
                          border: "1px solid rgba(200,160,30,0.35)",
                          color: "#c8a040", padding: "9px 22px", borderRadius: 30,
                          fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif",
                          letterSpacing: 0.5,
                        }}
                      >
                        View Interpretation
                      </button>
                    ) : null;
                  })()}
                  <Dialog.Close asChild>
                    <button style={{
                      background: "none",
                      border: "1px solid rgba(144,102,212,0.35)",
                      color: "#8a6ab0", padding: "9px 22px", borderRadius: 30,
                      fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif",
                      letterSpacing: 0.5,
                    }}>
                      Close
                    </button>
                  </Dialog.Close>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
