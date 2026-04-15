import * as Select from "@radix-ui/react-select";

export default function DreamSelect({ value, onValueChange, placeholder, options }) {
  return (
    <Select.Root value={value || "__all__"} onValueChange={(v) => onValueChange(v === "__all__" ? "" : v)}>
      <Select.Trigger
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, background: "rgba(5,10,20,0.9)", border: "1px solid rgba(200,160,30,0.2)",
          borderRadius: 10, padding: "9px 14px", color: value ? "#f5e4b0" : "#8a7540",
          fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "Georgia, serif",
          minWidth: 120,
        }}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon style={{ color: "#8a7540", fontSize: 10 }}>▼</Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          style={{
            background: "rgba(10,6,28,0.98)", border: "1px solid rgba(200,160,30,0.25)",
            borderRadius: 12, padding: 4, zIndex: 9999,
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            maxHeight: 260, overflow: "auto",
            minWidth: "var(--radix-select-trigger-width)",
          }}
        >
          <Select.Viewport>
            <SelectItem value="__all__">{placeholder}</SelectItem>
            {options.map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value;
              const label = typeof opt === "string" ? opt : opt.label;
              return <SelectItem key={val} value={val}>{label}</SelectItem>;
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SelectItem({ children, value, ...props }) {
  return (
    <Select.Item
      value={value}
      {...props}
      style={{
        display: "flex", alignItems: "center", padding: "8px 12px",
        borderRadius: 8, fontSize: 13, color: "#d4b870", cursor: "pointer",
        outline: "none", fontFamily: "Georgia, serif",
        userSelect: "none",
      }}
      // Radix uses data-highlighted for keyboard/hover focus
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,160,30,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
}
