import os
import re
import json
from dotenv import load_dotenv
from modules.xml_flow_parser import XMLFlowParser

load_dotenv()

class OBDPromptAgent:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY")
        self.model = None
        self.ollama_model = "minimax-m2.7:cloud"
        
        # Check if Ollama is available
        try:
            import ollama
            self.ollama_client = ollama
            # Quick check if model exists
            tags = self.ollama_client.list()
            model_names = [m.model for m in tags.models]
            if self.ollama_model not in model_names:
                # If target model missing, pick the first available
                if model_names:
                    self.ollama_model = model_names[0]
            print(f"DEBUG AI: Initialized Ollama with model {self.ollama_model}")
        except Exception as e:
            print(f"DEBUG AI: Ollama not available ({e})")
            self.ollama_client = None

        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                self.model = "gemini-2.0-flash"
                print("DEBUG AI: Initialized Gemini 2.0 Flash (Fallback)")
            except ImportError:
                try:
                    import google.generativeai as genai_legacy
                    genai_legacy.configure(api_key=self.api_key)
                    self.model_legacy = genai_legacy.GenerativeModel('gemini-1.5-flash')
                    self.model = "legacy"
                    print("DEBUG AI: Initialized Legacy SDK (Gemini 1.5 Flash - Fallback)")
                except ImportError:
                    print("DEBUG AI Error: No Gemini SDKs found!")

    def get_status(self):
        """Returns the current active AI configuration."""
        if self.ollama_client:
            return {
                "status": "Online",
                "model": self.ollama_model,
                "provider": "Ollama (Local)"
            }
        if self.model:
            return {
                "status": "Online",
                "model": self.model if self.model != "legacy" else "gemini-1.5-flash",
                "provider": "Google Gemini (Fallback)"
            }
        return {
            "status": "Offline",
            "detail": "No AI engine initialized"
        }

    def _generate(self, prompt):
        """Unified generation method with primary Ollama and fallback Gemini."""
        # 1. Attempt Ollama
        if self.ollama_client:
            try:
                print(f"DEBUG AI: Generating with Ollama ({self.ollama_model})...")
                response = self.ollama_client.chat(model=self.ollama_model, messages=[
                    {'role': 'user', 'content': prompt},
                ])
                if response and 'message' in response and 'content' in response['message']:
                    return response['message']['content']
            except Exception as e:
                print(f"DEBUG AI Error (Ollama): {str(e)}. Attempting Gemini fallback...")

        # 2. Attempt Gemini
        if not self.model:
            print("DEBUG AI Error: No model initialized!")
            return None
            
        print(f"DEBUG AI: Generating with Gemini (Length: {len(prompt)} chars)...")
        try:
            if self.model == "legacy":
                response = self.model_legacy.generate_content(prompt)
                if response and hasattr(response, 'text'):
                    return response.text
            else:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )
                if response and hasattr(response, 'text'):
                    return response.text
        except Exception as e:
            print(f"DEBUG AI Error (Gemini): {str(e)}")
            return None
        return None

    def generate_flow_json(self, doc_text):
        """Analyzes a product document and returns a JSON structure."""
        prompt = f"""
        Analyze the following campaign description and design a professional IVR/OBD call flow.
        
        Description:
        {doc_text}

        You must output a JSON object with:
        - "nodes": [{{ "id": "string", "label": "string", "type": "start|play|input|condition|end" }}]
        - "edges": [{{ "source": "id1", "target": "id2", "label": "logic" }}]

        Rules:
        1. Keep labels professional.
        2. Output ONLY raw JSON.
        """
        result = self._generate(prompt)
        return self._clean_json(result)

    def generate_scp_flow_json(self, doc_text):
        """Generates a specialized SCP IVR flow JSON for the interactive builder."""
        SYSTEM = """You are an expert BnG SCP IVR flow designer. Given an IVR flow description, extract all nodes and connections and return ONLY valid JSON — no markdown, no explanation, no code blocks.

Node types MUST be one of: Start, Navigation, Play, Database, URL, Processing, Exit, DigitCollect, StartRecord, Transfer
Edge types MUST be one of: DTMF, DB, Normal
- DTMF = key press routing (label = digit pressed: "1","2","Any","NoInput","#")
- DB = database result routing (label = result value: "active","new","grace","parking")
- Normal = unconditional flow (label = "")

Layout rules:
- Start node at x:400 y:50
- Each layer ~200px below the previous
- Sibling nodes spread ~280px apart horizontally
- Every node must have unique short id (letters/numbers only, no spaces)

Return ONLY this JSON structure, nothing else:
{
  "flowName": "ServiceName",
  "nodes": [
    {"id":"start","type":"Start","label":"ServiceName","x":400,"y":50,"params":{"calltype":"IVR","service":"ServiceName","shortcode":"","defaultlang":"_E"}},
    {"id":"lang","type":"Navigation","label":"Language_Selection","x":400,"y":250,"params":{"promptfile":"/IVR/lang.wav","timeout":"5","repeatcount":"1","bargein":"true"}}
  ],
  "edges": [
    {"id":"e1","source":"start","target":"lang","type":"Normal","label":""},
    {"id":"e2","source":"lang","target":"menu","type":"DTMF","label":"1"}
  ]
}"""
        prompt = f"{SYSTEM}\n\nDESCRIPTION:\n{doc_text}"
        result = self._generate(prompt)
        return self._clean_json(result)

    def generate_flow_json_from_xml(self, xml_content):
        """Analyzes technical XML (full or fragments) and returns a JSON structure."""
        print(f"DEBUG XML: Analyzing XML input (Length: {len(xml_content)} chars)")
        
        node_descriptions = []
        edge_descriptions = []
        
        # 1. Aggressive node extraction (ID + Name pairs)
        # Search for any <id>VALUE</id> followed closely by <name>LABEL</name> or <value>LABEL</value>
        matches = re.findall(r'<id>(.*?)</id>.*?<(?:name|value)[^>]*>(.*?)</(?:name|value)>', xml_content[:200000], re.S)
        for rid, name in matches:
            if rid.strip() and name.strip() and len(name) < 100:
                node_descriptions.append(f"Component: {rid.strip()} | Label: {name.strip()}")

        # 2. mxCell extraction for full files
        if not node_descriptions:
            cells = re.findall(r'<mxCell[^>]*>', xml_content[:200000])
            def get_attr(tag, attr):
                m = re.search(f'{attr}="([^"]*)"', tag)
                return m.group(1) if m else ""

            for cell in cells:
                val = get_attr(cell, "value")
                typ = get_attr(cell, "type")
                cid = get_attr(cell, "id")
                edge = get_attr(cell, "edge")
                
                if edge == "1":
                    src = get_attr(cell, "source")
                    tgt = get_attr(cell, "target")
                    if src and tgt:
                        edge_descriptions.append(f"Connection: {src} -> {tgt} (Logic: {val})")
                elif val or typ:
                    node_descriptions.append(f"Node: {cid} | Label: {val} | Tech Type: {typ}")
        
        # 3. Handle Edge extraction separately if nodes were found via fragments
        if not edge_descriptions:
            # Look for common connection patterns like next="id" or target="id"
            trans = re.findall(r'<(?:option|next|target)[^>]* (?:key|id|next)="([^"]*)"[^>]*>', xml_content[:150000])
            for t in trans:
                edge_descriptions.append(f"Potential Transition to: {t}")

        raw_sample = xml_content[:15000]

        prompt = f"""
        Analyze this IVR/OBD Campaign configuration. Reconstruct a logical call flow for visualization.
        
        EXTRACTED FRAGMENTS:
        Nodes Found:
        {"\n".join(node_descriptions[:100]) if node_descriptions else "None specifically detected. Please refer to raw XML."}

        Edge/Transition Hints:
        {"\n".join(edge_descriptions[:50]) if edge_descriptions else "None specifically detected. Please refer to raw XML."}

        RAW XML CONTEXT:
        {raw_sample}

        TASK:
        You must output a JSON object with "nodes" and "edges" for React Flow.
        - "nodes": [{{ "id": "id", "label": "Human Friendly Name", "type": "play|input|condition|end" }}]
        - "edges": [{{ "source": "id1", "target": "id2", "label": "keypress/logic" }}]

        STRATEGY:
        1. If you see 'Nodes' but no 'Edges', use the 'RAW XML' to infer the sequence (e.g., node A usually links to node B in IVR logic).
        2. Clean up labels. Use names like 'Welcome Message', 'Check Gender', 'Play Offer' instead of technical IDs.
        3. Output ONLY raw JSON. No conversational text.
        """
        
        result = self._generate(prompt)
        return self._clean_json(result)

    def _clean_json(self, text):
        """Standard JSON cleaning for AI responses."""
        if not text: return '{"nodes": [], "edges": []}'
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            text = text[start:end+1]
        
        try:
            json.loads(text)
            return text
        except:
            print(f"DEBUG AI Error: AI returned invalid JSON: {text[:100]}...")
            return '{"nodes": [], "edges": []}'

    def generate_prompts(self, context):
        result = self._generate(f"Design 3 IVR scripts for: {context}. Return as JSON list of strings.")
        return result or '["Welcome!"]'

    def generate_flow_mermaid(self, context):
        result = self._generate(f"Create Mermaid TD graph for: {context}. Raw code only.")
        return result or "graph TD\n  A[Start] --> B[End]"
    def generate_plain_description_from_xml(self, xml_content):
        """Returns a high-level plain English explanation of the campaign logic."""
        print(f"DEBUG AI: Generating Plain English explanation from XML (Length: {len(xml_content)})")
        
        parsed_data = XMLFlowParser.parse_xml(xml_content)
        flow_summary = XMLFlowParser.get_flow_summary(parsed_data)
        
        # Limit summary length for LLM if it's too big
        if len(flow_summary) > 20000:
            flow_summary = flow_summary[:20000] + "\n...[truncated for length]..."

        prompt = f"""
        You are an expert campaign designer. Below is a structured summary of an IVR/OBD campaign flow extracted from SCP configuration XML.
        
        CAMPAIGN FLOW SUMMARY:
        {flow_summary}
        
        TASK:
        Provide a professional, clear, and high-level "Plain English" description of this campaign.
        - Start with the Campaign Name and its primary objective (e.g. "This is a Loyalty Retention campaign...").
        - Describe the main user journey (e.g. "When a user calls/receives a call, first we check X, then we play Y...").
        - Explain key decision points (e.g. "If the user is Active, they go to the Main Menu, otherwise they are redirected to...").
        - Include any special processing logic found (e.g. "We set the user's language preference based on...").
        - Keep it human-readable, not technical. Avoid mentioning XML tags or mxCells.
        
        Format the output in clean Markdown using '### Heading' for each section so it can be parsed correctly.
        """
        
        result = self._generate(prompt)
        return result or "Unable to generate description from the provided XML."
