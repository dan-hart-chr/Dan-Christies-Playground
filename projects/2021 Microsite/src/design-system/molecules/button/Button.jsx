import React from "react";
import "./default.css";

export default function Button({
  className = "",
  children,
  buttonCopy = "Button label",
  type = "Primary",
  state = "Default",
  mode = "Light",
  iconography = "False",
  version = "Current",
  onClick,
  disabled = false,
  ...props
}) {
  const baseStyles = "flex items-center justify-center gap-2 rounded-full font-medium text-xs uppercase transition-all duration-200 cursor-pointer font-arizona-sans h-12 px-8 py-4 w-60";
  
  // Determine colors based on type and mode
  let colorClasses = "";
  
  if (type === "Primary") {
    colorClasses = mode === "Dark" 
      ? "bg-white text-black hover:bg-gray-100" 
      : "bg-black text-white hover:bg-gray-800";
  } else if (type === "Secondary") {
    colorClasses = mode === "Dark"
      ? "border border-white text-white hover:bg-white hover:bg-opacity-10"
      : "border border-black text-black hover:bg-black hover:bg-opacity-5";
  } else if (type === "Link/Tertiary") {
    colorClasses = "text-black underline hover:no-underline";
  }
  
  // Disabled state
  if (disabled) {
    colorClasses = "opacity-50 cursor-not-allowed";
  }
  
  // Focus state
  if (state === "Focus") {
    colorClasses += " ring-2 ring-offset-2 ring-black";
  }
  
  const finalClassName = `${baseStyles} ${colorClasses} ${className}`;
  
  return (
    <button
      className={finalClassName}
      onClick={onClick}
      disabled={disabled}
      {...props}
      data-node-id="96:139"
    >
      {children || buttonCopy}
    </button>
  );
}
