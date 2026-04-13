import * as Switch from "@radix-ui/react-switch";

export default function DreamSwitch({ checked, onCheckedChange, disabled }) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked
          ? "linear-gradient(135deg,#6847c0,#9066d4)"
          : "rgba(60,30,100,0.6)",
        border: "1px solid rgba(200,160,30,0.3)",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Switch.Thumb
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#f5e4b0",
          transition: "transform 0.2s",
          transform: checked ? "translateX(21px)" : "translateX(2px)",
          marginTop: 2,
        }}
      />
    </Switch.Root>
  );
}
