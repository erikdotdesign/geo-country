figma.showUI(__html__, { themeColors: true, width: 350, height: 520 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "create-geo-shape") {
    
  }
  figma.closePlugin();
};