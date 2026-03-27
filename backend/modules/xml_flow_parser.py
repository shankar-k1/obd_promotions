import re
from typing import Dict, List, Any

class XMLFlowParser:
    """
    Parses specialized mxGraph XML files into a structured format.
    """
    
    @staticmethod
    def parse_xml(xml_content: str) -> Dict[str, Any]:
        nodes = {}
        edges = []
        
        # 1. Extract mxCells
        # We use a non-greedy regex to find all cells
        cells = re.findall(r'<mxCell[^>]*>(?:<mxGeometry[^>]*/>)?(?:<mxParams[^>]*>.*?</mxParams>)?</mxCell>', xml_content, re.S)
        
        if not cells:
            # Fallback to just the tags if they are not closed with </mxCell> in some versions
            cells = re.findall(r'<mxCell[^>]*>', xml_content)

        def get_attr(tag, attr):
            m = re.search(f'{attr}="([^"]*)"', tag)
            return m.group(1) if m else ""

        for cell in cells:
            cid = get_attr(cell, "id")
            val = get_attr(cell, "value")
            typ = get_attr(cell, "type")
            is_edge = get_attr(cell, "edge") == "1"
            
            # Extract mxParams if they exist
            params = {}
            params_match = re.search(r'<mxParams[^>]*>(.*?)</mxParams>', cell, re.S)
            if params_match:
                recs = re.findall(r'<rec>(.*?)</rec>', params_match.group(1), re.S)
                for rec in recs:
                    rid_match = re.search(r'<id>(.*?)</id>', rec)
                    # We look for the first value in <values><value>...</value></values>
                    val_match = re.search(r'<value[^>]*>(.*?)</value>', rec)
                    if rid_match and val_match:
                        params[rid_match.group(1)] = val_match.group(1)

            if is_edge:
                edges.append({
                    "id": cid,
                    "source": get_attr(cell, "source"),
                    "target": get_attr(cell, "target"),
                    "label": val,
                    "params": params
                })
            else:
                nodes[cid] = {
                    "id": cid,
                    "label": val,
                    "type": typ,
                    "params": params
                }
        
        return {
            "nodes": list(nodes.values()),
            "edges": edges
        }

    @staticmethod
    def get_flow_summary(parsed_data: Dict[str, Any]) -> str:
        """Converts parsed data into a textual summary for the LLM."""
        summary = "Flow Components:\n"
        for node in parsed_data["nodes"]:
            desc = node["params"].get("servicedescription", node["label"])
            node_info = f"- [{node['id']}] {node['type']}: {desc}"
            if node["type"] == "Database":
                node_info += f" (Check: {node['params'].get('checkdb', 'N/A')})"
            if node["type"] == "Navigation":
                node_info += f" (Prompt: {node['params'].get('promptfile', 'N/A')})"
            summary += node_info + "\n"
            
        summary += "\nConnections:\n"
        for edge in parsed_data["edges"]:
            src_node = next((n for n in parsed_data["nodes"] if n["id"] == edge["source"]), None)
            tgt_node = next((n for n in parsed_data["nodes"] if n["id"] == edge["target"]), None)
            
            src_lbl = src_node["label"] if src_node else edge["source"]
            tgt_lbl = tgt_node["label"] if tgt_node else edge["target"]
            
            summary += f"- {src_lbl} -> {tgt_lbl}"
            if edge["label"]:
                summary += f" (Condition: {edge['label']})"
            summary += "\n"
            
        return summary
