import React from "react";
import "./default.css";

export default function StatedefaultTypeprimaryIconographyfalseVersioncurrentModedarkDevicedesktop({className="", ...props}) {
  return (
    <span className={className} {...props} dangerouslySetInnerHTML={{__html: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"40\"><rect width=\"100%\" height=\"100%\" fill=\"#eee\"/><text x=\"10\" y=\"25\">State=Default, Type=Primary, Iconography=False, Version=Current, Mode=Dark, Device=Desktop</text></svg>" }} />
  );
}
