export default function ExportPDF({ dreams }) {
  const generatePDF = async () => {
    // Dynamic import to avoid bundling jspdf for all users
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Title page
    doc.setFontSize(28);
    doc.setTextColor(100, 50, 180);
    doc.text("Dreamscape", pageWidth / 2, 60, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(120, 100, 160);
    doc.text("Dream Journal Export", pageWidth / 2, 72, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(140, 120, 180);
    doc.text(`${dreams.length} dreams recorded`, pageWidth / 2, 84, { align: "center" });
    doc.text(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), pageWidth / 2, 92, { align: "center" });

    // Stats summary
    y = 110;
    doc.setFontSize(10);
    doc.setTextColor(80, 60, 120);
    const lucidCount = dreams.filter(d => d.is_lucid).length;
    const avgSleep = dreams.filter(d => d.sleep_hours).reduce((sum, d) => sum + Number(d.sleep_hours), 0) / (dreams.filter(d => d.sleep_hours).length || 1);
    doc.text(`Lucid dreams: ${lucidCount} | Avg sleep: ${avgSleep.toFixed(1)}h`, pageWidth / 2, y, { align: "center" });

    doc.addPage();
    y = 20;

    // Dreams
    for (const dream of dreams) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const date = new Date(dream.created_at).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric"
      });

      // Title
      doc.setFontSize(14);
      doc.setTextColor(80, 40, 160);
      doc.text(dream.title, margin, y);
      y += 6;

      // Meta
      doc.setFontSize(9);
      doc.setTextColor(120, 100, 160);
      const meta = [date, dream.mood, dream.theme, dream.is_lucid ? "Lucid" : null, dream.sleep_hours ? `${dream.sleep_hours}h sleep` : null].filter(Boolean).join(" | ");
      doc.text(meta, margin, y);
      y += 4;

      // Tags
      if (dream.tags?.length > 0) {
        doc.text(`Tags: ${dream.tags.join(", ")}`, margin, y);
        y += 4;
      }

      // Characters
      if (dream.characters?.length > 0) {
        doc.text(`Characters: ${dream.characters.join(", ")}`, margin, y);
        y += 4;
      }

      y += 2;

      // Description
      doc.setFontSize(10);
      doc.setTextColor(60, 50, 80);
      const descLines = doc.splitTextToSize(dream.description, maxWidth);
      for (const line of descLines) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 5;
      }

      // Interpretation
      if (dream.interpretation) {
        y += 4;
        doc.setFontSize(9);
        doc.setTextColor(100, 70, 180);
        doc.text("AI Interpretation:", margin, y);
        y += 5;
        doc.setTextColor(80, 60, 140);
        const interpLines = doc.splitTextToSize(dream.interpretation, maxWidth);
        for (const line of interpLines) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += 5;
        }
      }

      // Separator
      y += 6;
      doc.setDrawColor(180, 160, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    }

    doc.save("dreamscape-journal.pdf");
  };

  return (
    <button
      onClick={generatePDF}
      disabled={dreams.length === 0}
      style={{
        background: dreams.length === 0 ? "rgba(100,50,180,0.2)" : "linear-gradient(135deg, #6020cc, #9040ee)",
        border: "none", color: dreams.length === 0 ? "#6050a0" : "white",
        padding: "10px 22px", borderRadius: 40, fontSize: 13,
        cursor: dreams.length === 0 ? "not-allowed" : "pointer",
        letterSpacing: 0.5, boxShadow: dreams.length > 0 ? "0 4px 20px rgba(120,40,220,0.3)" : "none"
      }}
    >
      Export PDF
    </button>
  );
}
